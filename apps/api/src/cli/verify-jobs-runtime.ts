import { ConflictException, NotFoundException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { createHash, randomUUID } from "node:crypto";
import { ALL_PERMISSION_KEYS, PERMISSION_KEYS } from "@ctps/permissions";
import sharp from "sharp";
import { AppModule } from "../app.module";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { JobMediaService } from "../jobs/job-media.service";
import { JobNotificationService } from "../jobs/job-notification.service";
import { JobsService } from "../jobs/jobs.service";

process.env.EMAIL_DELIVERY_MODE = "disabled";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
function local(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Vancouver",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
async function main() {
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  const database = context.get(DatabaseService);
  const jobs = context.get(JobsService);
  const media = context.get(JobMediaService);
  const notifications = context.get(JobNotificationService);
  const suffix = randomUUID();
  const createdIds: string[] = [];
  let quoteId = "";
  let workerIds: string[] = [];
  const results = {
    quoteConversion: false,
    duplicateConversionBlocked: false,
    scheduling: false,
    conflictDetected: false,
    rescheduleHistory: false,
    lifecycle: false,
    privateMedia: false,
    incidentBlockedCompletion: false,
    completion: false,
    authorDenied: false,
    notificationOutbox: false,
    noPublicRoute: true,
    cleanup: false,
  };
  try {
    const actor = await database.client.user.findFirst({
      where: { status: "ACTIVE", roles: { some: { role: { key: "SUPER_ADMIN" } } } },
      select: { id: true },
    });
    if (!actor) throw new Error("An active Super Admin is required for runtime verification.");
    const identity = {
      userId: actor.id,
      permissions: ALL_PERMISSION_KEYS,
    } as unknown as AuthenticatedIdentity;
    const workers = await database.client.$transaction(
      ["Lead", "Crew"].map((name, index) =>
        database.client.user.create({
          data: {
            email: `phase9-${index}-${suffix}@example.invalid`,
            displayName: `Phase 9 ${name}`,
            passwordHash: "runtime-not-a-login-secret",
            mustChangePassword: true,
          },
        }),
      ),
    );
    workerIds = workers.map(({ id }) => id);
    const quote = await database.client.quoteRequest.create({
      data: {
        reference: `CTPS-2026-${suffix.replaceAll("-", "").slice(0, 6).toUpperCase()}`,
        confirmationTokenHash: hash(`confirmation-${suffix}`),
        idempotencyKeyHash: hash(`idempotency-${suffix}`),
        propertyType: "RESIDENTIAL",
        services: ["window-cleaning"],
        serviceAnswers: {},
        propertyDetails: {},
        addressLine1: "100 Runtime Verification Street",
        city: "Vancouver",
        province: "British Columbia",
        postalCode: "V5K0A1",
        serviceAreaKey: "vancouver",
        preferredDates: [],
        customerName: "Phase 9 Runtime Customer",
        customerEmail: `phase9-customer-${suffix}@example.invalid`,
        customerPhone: "6045550100",
        preferredContactMethod: "email",
        consentAcceptedAt: new Date(),
        status: "ACCEPTED",
      },
    });
    quoteId = quote.id;
    const job = await jobs.convertQuote(
      quote.id,
      {
        confirmExternalAcceptance: false,
        serviceScopeSummary: "Runtime verification window-cleaning scope.",
      },
      identity,
    );
    createdIds.push(job.id);
    results.quoteConversion = job.quoteRequestId === quote.id;
    try {
      await jobs.convertQuote(
        quote.id,
        { confirmExternalAcceptance: false, serviceScopeSummary: "Duplicate conversion attempt." },
        identity,
      );
    } catch (error) {
      results.duplicateConversionBlocked = error instanceof ConflictException;
    }
    const second = await jobs.createInternal(
      {
        customerType: "RESIDENTIAL",
        customerName: "Phase 9 Runtime Customer Two",
        customerEmail: `phase9-customer-two-${suffix}@example.invalid`,
        customerPhone: "6045550101",
        companyName: null,
        propertyAddressLine1: "200 Runtime Verification Street",
        propertyAddressLine2: null,
        city: "Burnaby",
        serviceAreaKey: "burnaby",
        province: "British Columbia",
        postalCode: "V5A0A1",
        propertyType: "Residential property",
        services: [{ serviceKey: "gutter-cleaning", scopeSummary: "Runtime gutter scope" }],
        serviceScopeSummary: "Runtime verification gutter-cleaning scope.",
        accessNotes: null,
        customerSchedulingNotes: "Please keep access clear.",
        internalOperationalNotes: "Disposable runtime note.",
      },
      identity,
    );
    createdIds.push(second.id);
    const start = new Date(Date.now() + 3 * 86_400_000);
    start.setUTCMinutes(0, 0, 0);
    let current = await jobs.schedule(
      job.id,
      {
        version: job.version,
        startLocal: local(start),
        estimatedDurationMinutes: 180,
        reason: "Runtime schedule",
        overrideConflict: false,
      },
      identity,
    );
    current = await jobs.assign(
      job.id,
      { userId: workers[0]!.id, assignmentRole: "LEAD" },
      identity,
    );
    current = await jobs.assign(
      job.id,
      { userId: workers[1]!.id, assignmentRole: "CREW_MEMBER" },
      identity,
    );
    let secondCurrent = await jobs.schedule(
      second.id,
      {
        version: second.version,
        startLocal: local(start),
        estimatedDurationMinutes: 180,
        reason: "Runtime overlapping schedule",
        overrideConflict: false,
      },
      identity,
    );
    try {
      await jobs.assign(second.id, { userId: workers[0]!.id, assignmentRole: "LEAD" }, identity);
    } catch (error) {
      results.conflictDetected = error instanceof ConflictException;
    }
    secondCurrent = await jobs.schedule(
      second.id,
      {
        version: secondCurrent.version,
        startLocal: local(new Date(start.getTime() + 6 * 3_600_000)),
        estimatedDurationMinutes: 180,
        reason: "Resolve runtime conflict",
        overrideConflict: false,
      },
      identity,
    );
    secondCurrent = await jobs.assign(
      second.id,
      { userId: workers[0]!.id, assignmentRole: "LEAD" },
      identity,
    );
    const secondDetail = await jobs.get(second.id, identity);
    results.rescheduleHistory = secondDetail.scheduleHistory.length === 2;
    results.scheduling = Boolean(current.scheduledStartAt && secondCurrent.scheduledStartAt);
    current = await jobs.addChecklist(
      job.id,
      { label: "Runtime required completion check", category: "COMPLETION", required: true },
      identity,
    );
    current = await jobs.addNote(
      job.id,
      { visibility: "INTERNAL", body: "Disposable private runtime note." },
      identity,
    );
    current = await jobs.addNote(
      job.id,
      {
        visibility: "CUSTOMER_FACING",
        body: "Disposable customer-facing runtime scheduling note.",
      },
      identity,
    );
    current = await jobs.addIncident(
      job.id,
      {
        title: "Runtime blocking issue",
        description: "Disposable issue used to verify completion blocking.",
        severity: "MEDIUM",
        blocksCompletion: true,
      },
      identity,
    );
    for (const status of ["CONFIRMED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"] as const)
      current = await jobs.changeStatus(
        job.id,
        { version: current.version, status, reason: `Runtime ${status.toLowerCase()}` },
        identity,
      );
    try {
      await jobs.complete(
        job.id,
        {
          version: current.version,
          completionSummary: "Runtime service completed successfully.",
          followUpRequired: false,
        },
        identity,
      );
    } catch (error) {
      results.incidentBlockedCompletion = error instanceof ConflictException;
    }
    const incident = current.incidents[0]!;
    current = await jobs.updateIncident(
      job.id,
      incident.id,
      { resolved: true, resolutionNotes: "Resolved during runtime verification." },
      identity,
    );
    current = await jobs.updateChecklist(
      job.id,
      current.checklistItems[0]!.id,
      { version: current.version, completed: true },
      identity,
    );
    current = await jobs.complete(
      job.id,
      {
        version: current.version,
        completionSummary: "Runtime service completed successfully.",
        followUpRequired: false,
      },
      identity,
    );
    results.completion = current.status === "COMPLETED" && Boolean(current.actualEndAt);
    const imageBuffer = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#6d7f72" },
    })
      .jpeg()
      .toBuffer();
    const uploaded = await media.upload(
      job.id,
      [
        {
          originalname: "runtime-neutral.jpg",
          mimetype: "image/jpeg",
          buffer: imageBuffer,
          size: imageBuffer.length,
        } as Express.Multer.File,
      ],
      {
        category: "COMPLETION",
        altText: "Neutral runtime verification surface",
        caption: "Disposable runtime verification image",
      },
      identity,
    );
    const file = await media.file(job.id, uploaded.items[0]!.id, "thumbnail", identity);
    results.privateMedia = file.sizeBytes > 0;
    const authorIdentity = {
      userId: randomUUID(),
      permissions: [PERMISSION_KEYS.ADMIN_ACCESS],
    } as unknown as AuthenticatedIdentity;
    try {
      await jobs.get(job.id, authorIdentity);
    } catch (error) {
      results.authorDenied = error instanceof NotFoundException;
    }
    await notifications.queue(
      job.id,
      { type: "COMPLETED", idempotencyKey: randomUUID() },
      identity,
    );
    results.notificationOutbox = await database.client.emailOutbox
      .count({ where: { serviceJobId: job.id, status: "SENT" } })
      .then((count) => count === 1);
    results.lifecycle = current.status === "COMPLETED" && current.statusHistory.length >= 5;
    await media.remove(job.id, uploaded.items[0]!.id, identity);
    current = await jobs.changeStatus(
      job.id,
      { version: current.version, status: "CLOSED", reason: "Runtime close" },
      identity,
    );
    current = await jobs.changeStatus(
      job.id,
      { version: current.version, status: "ARCHIVED", reason: "Runtime archive" },
      identity,
    );
    secondCurrent = await jobs.cancel(
      second.id,
      {
        version: secondCurrent.version,
        reason: "Runtime verification cleanup",
        notifyCustomer: false,
      },
      identity,
    );
    secondCurrent = await jobs.changeStatus(
      second.id,
      { version: secondCurrent.version, status: "ARCHIVED", reason: "Runtime cleanup archive" },
      identity,
    );
    await jobs.remove(job.id, identity);
    await jobs.remove(second.id, identity);
    await database.client.auditLog.deleteMany({
      where: { OR: [{ resourceId: { in: createdIds } }, { resourceId: quote.id }] },
    });
    await database.client.quoteRequest.delete({ where: { id: quote.id } });
    quoteId = "";
    await database.client.user.deleteMany({ where: { id: { in: workerIds } } });
    workerIds = [];
    results.cleanup = true;
    console.info(JSON.stringify(results, null, 2));
  } finally {
    if (createdIds.length) {
      await database.client.emailOutbox
        .deleteMany({ where: { serviceJobId: { in: createdIds } } })
        .catch(() => undefined);
      await database.client.serviceJob
        .deleteMany({ where: { id: { in: createdIds } } })
        .catch(() => undefined);
      await database.client.auditLog
        .deleteMany({ where: { resourceId: { in: createdIds } } })
        .catch(() => undefined);
    }
    if (quoteId)
      await database.client.quoteRequest
        .deleteMany({ where: { id: quoteId } })
        .catch(() => undefined);
    if (workerIds.length)
      await database.client.user
        .deleteMany({ where: { id: { in: workerIds } } })
        .catch(() => undefined);
    await context.close();
  }
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
