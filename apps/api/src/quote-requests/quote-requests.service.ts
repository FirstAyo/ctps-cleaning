import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma, QuoteRequestStatus } from "@ctps/database";
import type { Request } from "express";
import type {
  QuoteAssignmentInput,
  QuoteInternalNoteInput,
  QuoteListQuery,
  QuoteStatusUpdateInput,
  QuoteSubmissionInput,
} from "@ctps/validation";
import { ESTIMATOR_QUESTIONS } from "@ctps/pricing";
import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";
import { QuoteConfigService } from "./quote-config.service";
import { QuoteEmailService } from "./quote-email.service";
import { QuoteSecurityService } from "./quote-security.service";
import { QuoteMediaService } from "./quote-media.service";
import {
  QUOTE_REFERENCE_COLLISION_ATTEMPTS,
  QuoteReferenceService,
} from "./quote-reference.service";

const transitions: Record<QuoteRequestStatus, readonly QuoteRequestStatus[]> = {
  NEW: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: [
    "MORE_INFORMATION_REQUIRED",
    "ESTIMATE_REVIEWED",
    "QUOTE_PREPARED",
    "CONTACTED",
    "CANCELLED",
  ],
  MORE_INFORMATION_REQUIRED: ["UNDER_REVIEW", "CONTACTED", "CANCELLED"],
  ESTIMATE_REVIEWED: ["QUOTE_PREPARED", "CONTACTED", "CANCELLED"],
  QUOTE_PREPARED: ["CONTACTED", "ACCEPTED", "DECLINED", "CANCELLED"],
  CONTACTED: ["UNDER_REVIEW", "QUOTE_PREPARED", "ACCEPTED", "DECLINED", "CLOSED", "CANCELLED"],
  ACCEPTED: ["CLOSED", "CANCELLED"],
  DECLINED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class QuoteRequestsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(QuoteConfigService) private readonly config: QuoteConfigService,
    @Inject(QuoteSecurityService) private readonly security: QuoteSecurityService,
    @Inject(QuoteEmailService) private readonly email: QuoteEmailService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(QuoteMediaService) private readonly media: QuoteMediaService,
    @Inject(QuoteReferenceService) private readonly references: QuoteReferenceService,
  ) {}
  async createDraft(request: Request) {
    this.security.assertTrustedBrowser(request);
    await this.security.throttle(request, "quote-draft");
    const token = this.security.token();
    const now = new Date();
    await this.database.client.quoteRequestDraft.create({
      data: {
        tokenHash: this.security.hash(token),
        sourceHash: this.security.source(request),
        startedAt: now,
        expiresAt: new Date(now.getTime() + this.config.value.QUOTE_DRAFT_TTL_SECONDS * 1000),
      },
    });
    return {
      draftToken: token,
      expiresAt: new Date(
        now.getTime() + this.config.value.QUOTE_DRAFT_TTL_SECONDS * 1000,
      ).toISOString(),
      services: (await import("@ctps/validation")).QUOTE_SERVICE_DEFINITIONS,
      serviceAreas: (await import("@ctps/validation")).QUOTE_SERVICE_AREA_DEFINITIONS,
    };
  }
  async submit(input: QuoteSubmissionInput, request: Request) {
    this.security.assertTrustedBrowser(request);
    await this.security.throttle(request, "quote-submit");
    const tokenHash = this.security.hash(input.draftToken);
    const keyHash = this.security.hash(input.idempotencyKey);
    const duplicate = await this.database.client.quoteRequest.findUnique({
      where: { idempotencyKeyHash: keyHash },
      select: { reference: true },
    });
    if (duplicate) return { reference: duplicate.reference, alreadySubmitted: true };
    const draft = await this.database.client.quoteRequestDraft.findUnique({
      where: { tokenHash },
      include: { uploads: { where: { status: "READY" } } },
    });
    if (!draft || draft.expiresAt < new Date() || draft.submittedAt)
      throw new ForbiddenException({
        code: "INVALID_DRAFT",
        message: "This quote session is invalid, expired, or already used.",
      });
    if (draft.sourceHash !== this.security.source(request))
      throw new ForbiddenException({
        code: "DRAFT_SOURCE_MISMATCH",
        message: "This quote session cannot be used from this browser context.",
      });
    if (
      Date.now() - draft.startedAt.getTime() <
      this.config.value.QUOTE_MIN_COMPLETION_SECONDS * 1000
    )
      throw new BadRequestException({
        code: "SUBMITTED_TOO_QUICKLY",
        message: "Please review the request before submitting.",
      });
    let estimateLink:
      | {
          id: string;
          matchStatus: "MATCHED" | "INPUTS_CHANGED" | "EXPIRED";
          snapshot: Prisma.InputJsonValue;
        }
      | undefined;
    if (input.estimateTransferToken) {
      const estimate = await this.database.client.estimateResult.findUnique({
        where: { transferTokenHash: this.security.hash(input.estimateTransferToken) },
        include: { quoteRequest: { select: { id: true } } },
      });
      if (estimate && !estimate.quoteRequest) {
        const normalized = estimate.normalizedInput as {
          serviceKey: string;
          customerType: string;
          serviceAreaKey: string;
          answers: Record<string, string | number | boolean>;
        };
        const mappedAnswers = Object.fromEntries(
          ESTIMATOR_QUESTIONS.filter(
            (question) =>
              question.serviceKey === normalized.serviceKey && question.quoteQuestionKey,
          ).map((question) => [question.quoteQuestionKey!, normalized.answers[question.key]]),
        );
        const quoteAnswers = input.serviceAnswers[normalized.serviceKey] ?? {};
        const unchanged =
          input.propertyType === normalized.customerType &&
          input.address.serviceAreaKey === normalized.serviceAreaKey &&
          input.services.includes(normalized.serviceKey as (typeof input.services)[number]) &&
          Object.entries(mappedAnswers).every(([key, value]) => quoteAnswers[key] === value);
        const expired =
          !estimate.transferTokenExpiresAt ||
          estimate.transferTokenExpiresAt <= new Date() ||
          estimate.expiresAt <= new Date();
        estimateLink = {
          id: estimate.id,
          matchStatus: expired ? "EXPIRED" : unchanged ? "MATCHED" : "INPUTS_CHANGED",
          snapshot: {
            pricingVersionCode: estimate.pricingVersionCode,
            serviceKey: estimate.serviceKey,
            outcome: estimate.outcome,
            minimumCents: estimate.minimumCents,
            maximumCents: estimate.maximumCents,
            currency: estimate.currency,
          },
        };
      }
    }
    const confirmationToken = this.security.token();
    let created;
    for (let attempt = 0; attempt < QUOTE_REFERENCE_COLLISION_ATTEMPTS; attempt += 1) {
      const reference = this.references.generate();
      try {
        created = await this.database.client.$transaction(
          async (transaction) => {
            const quote = await transaction.quoteRequest.create({
              data: {
                reference,
                confirmationTokenHash: this.security.hash(confirmationToken),
                idempotencyKeyHash: keyHash,
                propertyType: input.propertyType,
                services: input.services,
                serviceAnswers: input.serviceAnswers as Prisma.InputJsonValue,
                propertyDetails: input.propertyDetails as Prisma.InputJsonValue,
                addressLine1: input.address.line1,
                addressLine2: input.address.line2 ?? null,
                city: input.address.city,
                province: input.address.province,
                postalCode: input.address.postalCode.replace(" ", ""),
                serviceAreaKey: input.address.serviceAreaKey,
                preferredDates: input.preferredDates,
                customerName: input.contact.fullName,
                customerEmail: input.contact.email,
                customerPhone: input.contact.phone,
                preferredContactMethod: input.contact.preferredMethod,
                companyName: input.contact.companyName ?? null,
                notes: input.notes ?? null,
                consentAcceptedAt: new Date(),
                ...(estimateLink
                  ? {
                      estimateResultId: estimateLink.id,
                      estimateMatchStatus: estimateLink.matchStatus,
                      estimateSnapshot: estimateLink.snapshot,
                    }
                  : {}),
              },
            });
            await transaction.quoteRequestUpload.updateMany({
              where: { draftId: draft.id, status: "READY" },
              data: { draftId: null, quoteRequestId: quote.id },
            });
            await transaction.quoteRequestDraft.update({
              where: { id: draft.id },
              data: { submittedAt: new Date() },
            });
            if (estimateLink)
              await transaction.estimateResult.update({
                where: { id: estimateLink.id },
                data: { convertedAt: new Date() },
              });
            await transaction.emailOutbox.createMany({
              data: this.email.records({
                quoteRequestId: quote.id,
                reference,
                customerEmail: quote.customerEmail,
                customerName: quote.customerName,
                services: input.services,
                from: this.config.value.EMAIL_FROM,
                staffEmail: this.config.value.QUOTE_STAFF_EMAIL,
              }),
            });
            await transaction.auditLog.create({
              data: {
                action: "quote-request.submitted",
                resourceType: "quote-request",
                resourceId: quote.id,
                metadata: {
                  reference,
                  serviceCount: input.services.length,
                  uploadCount: draft.uploads.length,
                  estimateMatchStatus: estimateLink?.matchStatus ?? "NOT_LINKED",
                },
              },
            });
            return quote;
          },
          { isolationLevel: "Serializable" },
        );
        break;
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          const found = await this.database.client.quoteRequest.findUnique({
            where: { idempotencyKeyHash: keyHash },
            select: { reference: true },
          });
          if (found) return { reference: found.reference, alreadySubmitted: true };
          const target = (error as { meta?: { target?: unknown } }).meta?.target;
          const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")];
          if (fields.some((field) => field.includes("reference"))) continue;
        }
        throw error;
      }
    }
    if (!created)
      throw new ConflictException({
        code: "REFERENCE_COLLISION",
        message: "A reference could not be allocated. Please try again.",
      });
    try {
      await this.email.dispatchForRequest(created.id);
    } catch {
      // The committed request and durable outbox remain authoritative when immediate delivery fails.
    }
    return { reference: created.reference, confirmationToken, alreadySubmitted: false };
  }
  async confirmation(token: string) {
    const quote = await this.database.client.quoteRequest.findUnique({
      where: { confirmationTokenHash: this.security.hash(token) },
      select: { reference: true, createdAt: true },
    });
    if (!quote)
      throw new NotFoundException({
        code: "CONFIRMATION_NOT_FOUND",
        message: "Confirmation not found.",
      });
    return {
      reference: quote.reference,
      submittedAt: quote.createdAt.toISOString(),
      message: "Your request was received. This is not a quote or booking.",
    };
  }
  async list(query: QuoteListQuery) {
    const where: Prisma.QuoteRequestWhereInput = {
      archivedAt: query.archived ? { not: null } : null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assignedToUserId ? { assignedToUserId: query.assignedToUserId } : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search, mode: "insensitive" } },
              { customerName: { contains: query.search, mode: "insensitive" } },
              { customerEmail: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          reference: true,
          customerName: true,
          customerEmail: true,
          propertyType: true,
          services: true,
          status: true,
          assignedTo: { select: { id: true, displayName: true } },
          createdAt: true,
          archivedAt: true,
        },
      }),
      this.database.client.quoteRequest.count({ where }),
    ]);
    return { items, pagination: { page: query.page, pageSize: query.pageSize, total } };
  }
  async assignees() {
    return {
      items: await this.database.client.user.findMany({
        where: { status: "ACTIVE" },
        orderBy: { displayName: "asc" },
        select: { id: true, displayName: true, email: true },
      }),
    };
  }
  async get(id: string) {
    const quote = await this.database.client.quoteRequest.findUnique({
      where: { id },
      omit: { confirmationTokenHash: true, idempotencyKeyHash: true },
      include: {
        assignedTo: { select: { id: true, displayName: true, email: true } },
        estimateResult: {
          select: {
            id: true,
            serviceKey: true,
            outcome: true,
            minimumCents: true,
            maximumCents: true,
            currency: true,
            pricingVersionCode: true,
            createdAt: true,
            expiresAt: true,
          },
        },
        uploads: {
          where: { status: "READY" },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            originalFilename: true,
            width: true,
            height: true,
            sortOrder: true,
            createdAt: true,
          },
        },
        internalNotes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, displayName: true } } },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { id: true, displayName: true } } },
        },
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
    if (!quote)
      throw new NotFoundException({ code: "QUOTE_NOT_FOUND", message: "Quote request not found." });
    return quote;
  }
  async status(id: string, input: QuoteStatusUpdateInput, actor: string) {
    const quote = await this.database.client.quoteRequest.findUnique({ where: { id } });
    if (!quote)
      throw new NotFoundException({ code: "QUOTE_NOT_FOUND", message: "Quote request not found." });
    if (!transitions[quote.status].includes(input.status))
      throw new ConflictException({
        code: "INVALID_STATUS_TRANSITION",
        message: `${quote.status} cannot move to ${input.status}.`,
      });
    await this.database.client.$transaction([
      this.database.client.quoteRequest.update({ where: { id }, data: { status: input.status } }),
      this.database.client.quoteRequestStatusHistory.create({
        data: {
          quoteRequestId: id,
          actorUserId: actor,
          fromStatus: quote.status,
          toStatus: input.status,
        },
      }),
    ]);
    await this.audit.record({
      actorUserId: actor,
      action: "quote-request.status-changed",
      resourceType: "quote-request",
      resourceId: id,
      metadata: { from: quote.status, to: input.status },
    });
    return this.get(id);
  }
  async assign(id: string, input: QuoteAssignmentInput, actor: string) {
    await this.ensure(id);
    if (input.assignedToUserId) {
      const user = await this.database.client.user.findFirst({
        where: { id: input.assignedToUserId, status: "ACTIVE" },
      });
      if (!user)
        throw new BadRequestException({
          code: "INVALID_ASSIGNEE",
          message: "Choose an active staff member.",
        });
    }
    await this.database.client.quoteRequest.update({
      where: { id },
      data: { assignedToUserId: input.assignedToUserId },
    });
    await this.audit.record({
      actorUserId: actor,
      action: "quote-request.assigned",
      resourceType: "quote-request",
      resourceId: id,
      metadata: { assigned: !!input.assignedToUserId },
    });
    return this.get(id);
  }
  async note(id: string, input: QuoteInternalNoteInput, actor: string) {
    await this.ensure(id);
    await this.database.client.quoteRequestNote.create({
      data: { quoteRequestId: id, authorUserId: actor, body: input.body },
    });
    await this.audit.record({
      actorUserId: actor,
      action: "quote-request.internal-note-added",
      resourceType: "quote-request",
      resourceId: id,
    });
    return this.get(id);
  }
  async archive(id: string, archive: boolean, actor: string) {
    await this.ensure(id);
    await this.database.client.quoteRequest.update({
      where: { id },
      data: { archivedAt: archive ? new Date() : null },
    });
    await this.audit.record({
      actorUserId: actor,
      action: archive ? "quote-request.archived" : "quote-request.restored",
      resourceType: "quote-request",
      resourceId: id,
    });
    return { success: true };
  }
  async remove(id: string, actor: string) {
    const quote = await this.ensure(id);
    if (!quote.archivedAt || !["CLOSED", "CANCELLED", "DECLINED"].includes(quote.status))
      throw new ConflictException({
        code: "QUOTE_NOT_DELETABLE",
        message: "Only archived terminal requests may be deleted.",
      });
    const uploads = await this.database.client.quoteRequestUpload.findMany({
      where: { quoteRequestId: id },
      select: { id: true },
    });
    await this.database.client.quoteRequest.delete({ where: { id } });
    try {
      await this.media.deleteFiles(uploads.map(({ id: uploadId }) => uploadId));
    } catch {
      // Bytes remain non-public; operational reconciliation can remove a rare orphan.
    }
    await this.audit.record({
      actorUserId: actor,
      action: "quote-request.deleted",
      resourceType: "quote-request",
      resourceId: id,
      metadata: { reference: quote.reference },
    });
    return { success: true };
  }
  private async ensure(id: string) {
    const quote = await this.database.client.quoteRequest.findUnique({ where: { id } });
    if (!quote)
      throw new NotFoundException({ code: "QUOTE_NOT_FOUND", message: "Quote request not found." });
    return quote;
  }
}
