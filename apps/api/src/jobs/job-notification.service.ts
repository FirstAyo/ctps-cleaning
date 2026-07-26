import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import {
  createEmailDeliveryAdapter,
  customerJobNotification,
  type QuoteEmailMessage,
} from "@ctps/email";
import { hasPermission, PERMISSION_KEYS } from "@ctps/permissions";
import type { Prisma } from "@ctps/database";
import type { ServiceJobNotificationInput } from "@ctps/validation";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { JobsConfigService } from "./jobs-config.service";
import { formatVancouver } from "./jobs-time";
import { JobsService } from "./jobs.service";

@Injectable()
export class JobNotificationService {
  private readonly adapter;
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(JobsConfigService) private readonly config: JobsConfigService,
    @Inject(JobsService) private readonly jobs: JobsService,
  ) {
    const env = config.value;
    this.adapter = createEmailDeliveryAdapter(
      env.EMAIL_DELIVERY_MODE === "smtp"
        ? {
            mode: "smtp",
            host: env.SMTP_HOST!,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            ...(env.SMTP_USER
              ? {
                  user: env.SMTP_USER,
                  ...(env.SMTP_PASSWORD ? { password: env.SMTP_PASSWORD } : {}),
                }
              : {}),
          }
        : { mode: env.EMAIL_DELIVERY_MODE },
    );
  }
  async queue(jobId: string, input: ServiceJobNotificationInput, identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_MANAGE_CUSTOMER_NOTIFICATIONS))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You cannot queue job notifications.",
      });
    const job = await this.jobs.get(jobId, identity);
    const message = customerJobNotification({
      to: job.customerEmailSnapshot,
      from: this.config.value.EMAIL_FROM,
      name: job.customerNameSnapshot,
      reference: job.referenceNumber,
      type: input.type,
      ...(job.scheduledStartAt
        ? {
            scheduleText: `Appointment time: ${formatVancouver(job.scheduledStartAt)} (${this.config.value.JOBS_TIME_ZONE}).`,
          }
        : {}),
      ...(job.customerSchedulingNotes ? { customerNote: job.customerSchedulingNotes } : {}),
    });
    const record = await this.database.client.emailOutbox.upsert({
      where: { deduplicationKey: `job:${jobId}:${input.type}:${input.idempotencyKey}` },
      create: {
        serviceJobId: jobId,
        deduplicationKey: `job:${jobId}:${input.type}:${input.idempotencyKey}`,
        templateKey: `job-${input.type.toLowerCase()}`,
        recipient: message.to,
        payload: message as unknown as Prisma.InputJsonValue,
      },
      update: {},
    });
    await this.jobs.record(identity.userId, jobId, "job.notification_queued", {
      notificationId: record.id,
      type: input.type,
    });
    await this.dispatch(record.id, identity.userId);
    return {
      id: record.id,
      status: (
        await this.database.client.emailOutbox.findUniqueOrThrow({ where: { id: record.id } })
      ).status,
    };
  }
  async dispatch(id: string, actorUserId?: string) {
    const record = await this.database.client.emailOutbox.findFirst({
      where: {
        id,
        serviceJobId: { not: null },
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: 5 },
      },
    });
    if (!record) return;
    try {
      await this.adapter.send(record.payload as unknown as QuoteEmailMessage);
      await this.database.client.emailOutbox.update({
        where: { id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          attempts: { increment: 1 },
          lastErrorCode: null,
        },
      });
      if (record.serviceJobId)
        await this.jobs.record(actorUserId, record.serviceJobId, "job.notification_sent", {
          notificationId: id,
          templateKey: record.templateKey,
        });
    } catch (error) {
      await this.database.client.emailOutbox.update({
        where: { id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastErrorCode: error instanceof Error ? error.name.slice(0, 100) : "DELIVERY_ERROR",
        },
      });
      if (record.serviceJobId)
        await this.jobs.record(actorUserId, record.serviceJobId, "job.notification_failed", {
          notificationId: id,
          templateKey: record.templateKey,
        });
    }
  }
  async queueDueReminders() {
    const now = new Date();
    const until = new Date(
      now.getTime() + this.config.value.JOBS_REMINDER_HOURS_BEFORE * 3_600_000,
    );
    const jobs = await this.database.client.serviceJob.findMany({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        scheduledStartAt: { gt: now, lte: until },
      },
      take: this.config.value.JOBS_REMINDER_BATCH_SIZE,
    });
    let queued = 0;
    for (const job of jobs) {
      const deduplicationKey = `job:${job.id}:REMINDER:${job.scheduledStartAt!.toISOString()}`;
      const message = customerJobNotification({
        to: job.customerEmailSnapshot,
        from: this.config.value.EMAIL_FROM,
        name: job.customerNameSnapshot,
        reference: job.referenceNumber,
        type: "REMINDER",
        scheduleText: `Appointment time: ${formatVancouver(job.scheduledStartAt!)} (${this.config.value.JOBS_TIME_ZONE}).`,
        ...(job.customerSchedulingNotes ? { customerNote: job.customerSchedulingNotes } : {}),
      });
      try {
        const record = await this.database.client.emailOutbox.create({
          data: {
            serviceJobId: job.id,
            deduplicationKey,
            templateKey: "job-reminder",
            recipient: message.to,
            payload: message as unknown as Prisma.InputJsonValue,
          },
        });
        await this.dispatch(record.id);
        queued += 1;
      } catch (error) {
        if ((error as { code?: string }).code !== "P2002") throw error;
      }
    }
    return { examined: jobs.length, queued };
  }
}
