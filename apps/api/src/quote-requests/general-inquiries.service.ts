import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@ctps/database";
import type { Request } from "express";
import type { GeneralInquiryListQuery, GeneralInquirySubmissionInput } from "@ctps/validation";
import { QUOTE_SERVICE_DEFINITIONS } from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";
import { GeneralInquiryEmailService } from "./general-inquiry-email.service";
import { QuoteConfigService } from "./quote-config.service";
import { QuoteSecurityService } from "./quote-security.service";

@Injectable()
export class GeneralInquiriesService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(QuoteConfigService) private readonly config: QuoteConfigService,
    @Inject(QuoteSecurityService) private readonly security: QuoteSecurityService,
    @Inject(GeneralInquiryEmailService) private readonly email: GeneralInquiryEmailService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async submit(input: GeneralInquirySubmissionInput, request: Request) {
    this.security.assertTrustedBrowser(request);
    await this.security.throttle(request, "general-inquiry-submit");
    const idempotencyKeyHash = this.security.hash(input.idempotencyKey);
    const duplicate = await this.database.client.generalInquiry.findUnique({
      where: { idempotencyKeyHash },
      select: { id: true },
    });
    if (duplicate) return { success: true, alreadySubmitted: true };

    let inquiry;
    try {
      inquiry = await this.database.client.$transaction(async (transaction) => {
        const created = await transaction.generalInquiry.create({
          data: {
            idempotencyKeyHash,
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            serviceKey: input.serviceKey ?? null,
            message: input.message,
          },
        });
        const serviceLabel = QUOTE_SERVICE_DEFINITIONS.find(
          ({ key }) => key === input.serviceKey,
        )?.label;
        await transaction.emailOutbox.createMany({
          data: this.email.records({
            generalInquiryId: created.id,
            customerEmail: created.email,
            customerName: created.name,
            ...(serviceLabel ? { serviceLabel } : {}),
            from: this.config.value.EMAIL_FROM,
            staffEmail: this.config.value.QUOTE_STAFF_EMAIL,
          }),
        });
        await transaction.auditLog.create({
          data: {
            action: "general-inquiry.submitted",
            resourceType: "general-inquiry",
            resourceId: created.id,
            metadata: {
              serviceSelected: Boolean(created.serviceKey),
            },
          },
        });
        return created;
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        const found = await this.database.client.generalInquiry.findUnique({
          where: { idempotencyKeyHash },
          select: { id: true },
        });
        if (found) return { success: true, alreadySubmitted: true };
      }
      throw error;
    }
    try {
      await this.email.dispatchForInquiry(inquiry.id);
    } catch {
      // Persistence and the durable outbox remain authoritative if immediate delivery fails.
    }
    return { success: true, alreadySubmitted: false };
  }

  async list(query: GeneralInquiryListQuery) {
    const where: Prisma.GeneralInquiryWhereInput = {
      archivedAt: query.archived ? { not: null } : null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { message: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.generalInquiry.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          serviceKey: true,
          message: true,
          status: true,
          createdAt: true,
          archivedAt: true,
        },
      }),
      this.database.client.generalInquiry.count({ where }),
    ]);
    return { items, pagination: { page: query.page, pageSize: query.pageSize, total } };
  }

  async get(id: string) {
    const inquiry = await this.database.client.generalInquiry.findUnique({
      where: { id },
      include: {
        emailMessages: {
          select: {
            templateKey: true,
            status: true,
            attempts: true,
            sentAt: true,
            lastErrorCode: true,
          },
        },
      },
    });
    if (!inquiry)
      throw new NotFoundException({
        code: "GENERAL_INQUIRY_NOT_FOUND",
        message: "General inquiry not found.",
      });
    return inquiry;
  }

  async setRead(id: string, read: boolean, actorUserId: string) {
    await this.get(id);
    const updated = await this.database.client.generalInquiry.update({
      where: { id },
      data: { status: read ? "READ" : "NEW" },
    });
    await this.audit.record({
      actorUserId,
      action: read ? "general-inquiry.read" : "general-inquiry.unread",
      resourceType: "general-inquiry",
      resourceId: id,
      metadata: {},
    });
    return updated;
  }

  async archive(id: string, archive: boolean, actorUserId: string) {
    await this.get(id);
    const updated = await this.database.client.generalInquiry.update({
      where: { id },
      data: { archivedAt: archive ? new Date() : null },
    });
    await this.audit.record({
      actorUserId,
      action: archive ? "general-inquiry.archived" : "general-inquiry.restored",
      resourceType: "general-inquiry",
      resourceId: id,
      metadata: {},
    });
    return updated;
  }
}
