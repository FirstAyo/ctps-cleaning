import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@ctps/database";
import {
  createEmailDeliveryAdapter,
  customerGeneralInquiryReceipt,
  staffGeneralInquiryNotification,
  type QuoteEmailMessage,
} from "@ctps/email";

import { DatabaseService } from "../database/database.service";
import { QuoteConfigService } from "./quote-config.service";

@Injectable()
export class GeneralInquiryEmailService {
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
    generalInquiryId: string;
    customerEmail: string;
    customerName: string;
    serviceLabel?: string;
    from: string;
    staffEmail: string;
  }) {
    const messages = [
      {
        templateKey: "general-inquiry-customer-receipt",
        message: customerGeneralInquiryReceipt({
          to: input.customerEmail,
          from: input.from,
          name: input.customerName,
        }),
      },
      {
        templateKey: "general-inquiry-staff-notification",
        message: staffGeneralInquiryNotification({
          to: input.staffEmail,
          from: input.from,
          ...(input.serviceLabel ? { serviceLabel: input.serviceLabel } : {}),
        }),
      },
    ];
    return messages.map(({ templateKey, message }) => ({
      generalInquiryId: input.generalInquiryId,
      deduplicationKey: `${input.generalInquiryId}:${templateKey}`,
      templateKey,
      recipient: message.to,
      payload: message as unknown as Prisma.InputJsonValue,
    }));
  }

  async dispatchForInquiry(generalInquiryId: string) {
    const records = await this.database.client.emailOutbox.findMany({
      where: {
        generalInquiryId,
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: 5 },
      },
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
        await this.database.client.emailOutbox.update({
          where: { id: record.id },
          data: {
            status: "FAILED",
            attempts: { increment: 1 },
            lastErrorCode: error instanceof Error ? error.name.slice(0, 100) : "DELIVERY_ERROR",
          },
        });
      }
    }
  }

  async dispatchPending() {
    const inquiries = await this.database.client.emailOutbox.findMany({
      where: {
        generalInquiryId: { not: null },
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: 5 },
      },
      distinct: ["generalInquiryId"],
      take: 50,
      select: { generalInquiryId: true },
    });
    for (const { generalInquiryId } of inquiries)
      if (generalInquiryId) await this.dispatchForInquiry(generalInquiryId);
    return { examined: inquiries.length, processed: inquiries.length };
  }
}
