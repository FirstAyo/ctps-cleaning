import { Injectable, Inject } from "@nestjs/common";
import {
  createEmailDeliveryAdapter,
  customerQuoteReceipt,
  staffQuoteNotification,
  type QuoteEmailMessage,
} from "@ctps/email";
import type { Prisma } from "@ctps/database";
import { DatabaseService } from "../database/database.service";
import { QuoteConfigService } from "./quote-config.service";

@Injectable()
export class QuoteEmailService {
  private readonly adapter;
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(QuoteConfigService) config: QuoteConfigService,
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
  records(input: {
    quoteRequestId: string;
    reference: string;
    customerEmail: string;
    customerName: string;
    services: readonly string[];
    from: string;
    staffEmail: string;
  }) {
    const messages = [
      {
        templateKey: "quote-customer-receipt",
        message: customerQuoteReceipt({
          to: input.customerEmail,
          from: input.from,
          name: input.customerName,
          reference: input.reference,
        }),
      },
      {
        templateKey: "quote-staff-notification",
        message: staffQuoteNotification({
          to: input.staffEmail,
          from: input.from,
          reference: input.reference,
          services: input.services,
        }),
      },
    ];
    return messages.map(({ templateKey, message }) => ({
      quoteRequestId: input.quoteRequestId,
      templateKey,
      recipient: message.to,
      payload: message as unknown as Prisma.InputJsonValue,
    }));
  }
  async dispatchForRequest(quoteRequestId: string) {
    const records = await this.database.client.emailOutbox.findMany({
      where: { quoteRequestId, status: { in: ["PENDING", "FAILED"] }, attempts: { lt: 5 } },
    });
    for (const record of records) {
      try {
        await this.adapter.send(record.payload as unknown as QuoteEmailMessage);
        await this.database.client.emailOutbox.update({
          where: { id: record.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: { increment: 1 },
            lastErrorCode: null,
          },
        });
      } catch (error) {
        const code = error instanceof Error ? error.name.slice(0, 100) : "DELIVERY_ERROR";
        await this.database.client.emailOutbox.update({
          where: { id: record.id },
          data: { status: "FAILED", attempts: { increment: 1 }, lastErrorCode: code },
        });
      }
    }
  }
  async dispatchPending() {
    const requests = await this.database.client.emailOutbox.findMany({
      where: {
        quoteRequestId: { not: null },
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: 5 },
      },
      distinct: ["quoteRequestId"],
      take: 50,
      select: { quoteRequestId: true },
    });
    for (const { quoteRequestId } of requests)
      if (quoteRequestId) await this.dispatchForRequest(quoteRequestId);
  }
}
