import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma, ServiceJobStatus } from "@ctps/database";
import { hasPermission, PERMISSION_KEYS } from "@ctps/permissions";
import type {
  ConvertQuoteToServiceJobInput,
  CreateInternalServiceJobInput,
  ServiceJobAssignmentInput,
  ServiceJobCalendarQuery,
  ServiceJobCancellationInput,
  ServiceJobChecklistItemInput,
  ServiceJobChecklistUpdateInput,
  ServiceJobCompletionInput,
  ServiceJobIncidentInput,
  ServiceJobIncidentUpdateInput,
  ServiceJobListQuery,
  ServiceJobNoteInput,
  ServiceJobNoteUpdateInput,
  ServiceJobScheduleInput,
  ServiceJobStatusTransitionInput,
  UpdateServiceJobInput,
} from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { JOB_REFERENCE_COLLISION_ATTEMPTS, JobReferenceService } from "./job-reference.service";
import { vancouverLocalToUtc } from "./jobs-time";

const inactiveConflictStatuses: ServiceJobStatus[] = ["CANCELLED", "CLOSED", "ARCHIVED"];
const transitions: Record<ServiceJobStatus, readonly ServiceJobStatus[]> = {
  DRAFT: ["READY_TO_SCHEDULE", "SCHEDULED", "CANCELLED", "ARCHIVED"],
  READY_TO_SCHEDULE: ["DRAFT", "SCHEDULED", "CANCELLED", "ARCHIVED"],
  SCHEDULED: ["DRAFT", "CONFIRMED", "EN_ROUTE", "CANCELLED", "ARCHIVED"],
  CONFIRMED: ["EN_ROUTE", "ARRIVED", "CANCELLED"],
  EN_ROUTE: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["PAUSED", "COMPLETED", "FOLLOW_UP_REQUIRED", "CANCELLED"],
  PAUSED: ["IN_PROGRESS", "COMPLETED", "FOLLOW_UP_REQUIRED", "CANCELLED"],
  COMPLETED: ["FOLLOW_UP_REQUIRED", "CLOSED", "ARCHIVED"],
  FOLLOW_UP_REQUIRED: ["IN_PROGRESS", "COMPLETED", "CLOSED", "ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

@Injectable()
export class JobsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(JobReferenceService) private readonly references: JobReferenceService,
  ) {}

  private allowed(identity: AuthenticatedIdentity, permission: keyof typeof PERMISSION_KEYS) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS[permission]))
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You do not have permission for this job action.",
      });
  }

  private async assertReadable(id: string, identity: AuthenticatedIdentity) {
    if (hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_READ)) return;
    if (hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_READ_ASSIGNED)) {
      const assignment = await this.database.client.serviceJobAssignment.findFirst({
        where: { jobId: id, userId: identity.userId, unassignedAt: null },
        select: { id: true },
      });
      if (assignment) return;
    }
    throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Job not found." });
  }

  private async ensure(id: string) {
    const job = await this.database.client.serviceJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Job not found." });
    return job;
  }

  async record(actorUserId: string | undefined, jobId: string, action: string, metadata?: unknown) {
    await Promise.all([
      this.audit.record({
        ...(actorUserId ? { actorUserId } : {}),
        action,
        resourceType: "service-job",
        resourceId: jobId,
        metadata,
      }),
      this.database.client.serviceJobActivity.create({
        data: {
          jobId,
          ...(actorUserId ? { actorUserId } : {}),
          action,
          ...(metadata === undefined ? {} : { metadata: metadata as Prisma.InputJsonValue }),
        },
      }),
    ]);
  }

  async list(query: ServiceJobListQuery, identity: AuthenticatedIdentity) {
    const canReadAll = hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_READ);
    if (!canReadAll && !hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_READ_ASSIGNED))
      this.allowed(identity, "JOBS_READ");
    const where: Prisma.ServiceJobWhereInput = {
      ...(canReadAll
        ? {}
        : { assignments: { some: { userId: identity.userId, unassignedAt: null } } }),
      archivedAt: query.archived ? { not: null } : null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.serviceAreaKey ? { serviceAreaKey: query.serviceAreaKey } : {}),
      ...(query.serviceKey ? { services: { some: { serviceKey: query.serviceKey } } } : {}),
      ...(query.assignedUserId
        ? { assignments: { some: { userId: query.assignedUserId, unassignedAt: null } } }
        : {}),
      ...(query.followUpRequired !== undefined ? { followUpRequired: query.followUpRequired } : {}),
      ...(query.scheduledFrom || query.scheduledTo
        ? {
            scheduledStartAt: {
              ...(query.scheduledFrom ? { gte: new Date(query.scheduledFrom) } : {}),
              ...(query.scheduledTo ? { lte: new Date(query.scheduledTo) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { referenceNumber: { contains: query.search.toUpperCase() } },
              { customerNameSnapshot: { contains: query.search, mode: "insensitive" } },
              { companyNameSnapshot: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.serviceJob.findMany({
        where,
        orderBy: [{ scheduledStartAt: "asc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          referenceNumber: true,
          customerNameSnapshot: true,
          status: true,
          serviceAreaKey: true,
          scheduledStartAt: true,
          scheduledEndAt: true,
          followUpRequired: true,
          archivedAt: true,
          updatedAt: true,
          services: { orderBy: { sortOrder: "asc" }, select: { serviceKey: true } },
          assignments: {
            where: { unassignedAt: null },
            select: { assignmentRole: true, user: { select: { id: true, displayName: true } } },
          },
        },
      }),
      this.database.client.serviceJob.count({ where }),
    ]);
    return { items, pagination: { page: query.page, pageSize: query.pageSize, total } };
  }

  async calendar(query: ServiceJobCalendarQuery, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_VIEW_CALENDAR");
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from || to.getTime() - from.getTime() > 93 * 86_400_000)
      throw new BadRequestException({
        code: "INVALID_CALENDAR_RANGE",
        message: "Choose a range of no more than 93 days.",
      });
    return {
      items: await this.database.client.serviceJob.findMany({
        where: {
          scheduledStartAt: { lt: to },
          scheduledEndAt: { gt: from },
          status: query.status ?? { notIn: ["CANCELLED", "ARCHIVED"] },
          ...(query.assignedUserId
            ? { assignments: { some: { userId: query.assignedUserId, unassignedAt: null } } }
            : {}),
          ...(query.serviceKey ? { services: { some: { serviceKey: query.serviceKey } } } : {}),
          ...(query.serviceAreaKey ? { serviceAreaKey: query.serviceAreaKey } : {}),
        },
        orderBy: { scheduledStartAt: "asc" },
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          scheduledStartAt: true,
          scheduledEndAt: true,
          serviceAreaKey: true,
          services: { select: { serviceKey: true } },
          assignments: {
            where: { unassignedAt: null },
            select: { assignmentRole: true, user: { select: { id: true, displayName: true } } },
          },
        },
      }),
    };
  }

  async get(id: string, identity: AuthenticatedIdentity) {
    await this.assertReadable(id, identity);
    const job = await this.database.client.serviceJob.findUnique({
      where: { id },
      include: {
        quoteRequest: {
          select: {
            id: true,
            reference: true,
            status: true,
            estimateSnapshot: true,
            estimateMatchStatus: true,
          },
        },
        coordinator: { select: { id: true, displayName: true } },
        services: { orderBy: { sortOrder: "asc" } },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            user: { select: { id: true, displayName: true, status: true } },
            assignedBy: { select: { displayName: true } },
          },
        },
        checklistItems: {
          orderBy: { sortOrder: "asc" },
          include: { completedBy: { select: { displayName: true } } },
        },
        notes: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, displayName: true } } },
        },
        incidents: {
          orderBy: { createdAt: "desc" },
          include: {
            reportedBy: { select: { displayName: true } },
            resolvedBy: { select: { displayName: true } },
          },
        },
        media: {
          where: { removedAt: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            originalFilename: true,
            category: true,
            altText: true,
            caption: true,
            width: true,
            height: true,
            createdAt: true,
            uploader: { select: { displayName: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { changedBy: { select: { displayName: true } } },
        },
        scheduleHistory: {
          orderBy: { createdAt: "desc" },
          include: { changedBy: { select: { displayName: true } } },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { actor: { select: { displayName: true } } },
        },
        emailMessages: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            templateKey: true,
            status: true,
            attempts: true,
            sentAt: true,
            lastErrorCode: true,
            createdAt: true,
          },
        },
      },
    });
    if (!job) throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Job not found." });
    return job;
  }

  async staff() {
    return {
      items: await this.database.client.user.findMany({
        where: { status: "ACTIVE" },
        orderBy: { displayName: "asc" },
        select: { id: true, displayName: true },
      }),
    };
  }

  async eligibleQuotes() {
    return {
      items: await this.database.client.quoteRequest.findMany({
        where: {
          status: { in: ["ACCEPTED", "QUOTE_PREPARED", "CONTACTED"] },
          serviceJobs: { none: {} },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          reference: true,
          customerName: true,
          status: true,
          services: true,
          serviceAreaKey: true,
          createdAt: true,
        },
      }),
    };
  }

  async createInternal(input: CreateInternalServiceJobInput, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_CREATE_INTERNAL");
    for (let attempt = 0; attempt < JOB_REFERENCE_COLLISION_ATTEMPTS; attempt += 1) {
      const referenceNumber = this.references.generate();
      try {
        const job = await this.database.client.serviceJob.create({
          data: {
            referenceNumber,
            customerType: input.customerType,
            customerNameSnapshot: input.customerName,
            customerEmailSnapshot: input.customerEmail.toLowerCase(),
            customerPhoneSnapshot: input.customerPhone,
            companyNameSnapshot: input.companyName ?? null,
            propertyAddressLine1Snapshot: input.propertyAddressLine1,
            propertyAddressLine2Snapshot: input.propertyAddressLine2 ?? null,
            citySnapshot: input.city,
            serviceAreaKey: input.serviceAreaKey,
            province: input.province,
            postalCodeSnapshot: input.postalCode.replace(/\s/g, "").toUpperCase(),
            propertyTypeSnapshot: input.propertyType,
            serviceScopeSummary: input.serviceScopeSummary,
            accessNotes: input.accessNotes ?? null,
            customerSchedulingNotes: input.customerSchedulingNotes ?? null,
            internalOperationalNotes: input.internalOperationalNotes ?? null,
            createdByUserId: identity.userId,
            updatedByUserId: identity.userId,
            services: {
              create: input.services.map((service, sortOrder) => ({ ...service, sortOrder })),
            },
          },
        });
        await this.record(identity.userId, job.id, "job.created", {
          referenceNumber,
          source: "staff",
        });
        return this.get(job.id, identity);
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") continue;
        throw error;
      }
    }
    throw new ConflictException({
      code: "JOB_REFERENCE_COLLISION",
      message: "A job reference could not be allocated.",
    });
  }

  async convertQuote(
    quoteRequestId: string,
    input: ConvertQuoteToServiceJobInput,
    identity: AuthenticatedIdentity,
  ) {
    this.allowed(identity, "JOBS_CREATE_FROM_QUOTE");
    for (let attempt = 0; attempt < JOB_REFERENCE_COLLISION_ATTEMPTS; attempt += 1) {
      const referenceNumber = this.references.generate();
      try {
        const job = await this.database.client.$transaction(
          async (transaction) => {
            const quote = await transaction.quoteRequest.findUnique({
              where: { id: quoteRequestId },
              include: { serviceJobs: { select: { id: true } } },
            });
            if (!quote)
              throw new NotFoundException({
                code: "QUOTE_NOT_FOUND",
                message: "Quote request not found.",
              });
            const directlyEligible = quote.status === "ACCEPTED";
            const externallyAccepted =
              input.confirmExternalAcceptance &&
              ["QUOTE_PREPARED", "CONTACTED"].includes(quote.status);
            if (!directlyEligible && !externallyAccepted)
              throw new ConflictException({
                code: "QUOTE_NOT_ELIGIBLE",
                message: "The quote must be accepted before a job is created.",
              });
            if (quote.serviceJobs.length)
              throw new ConflictException({
                code: "JOB_ALREADY_EXISTS",
                message: "This quote request already has a linked job.",
              });
            const serviceKeys = Array.isArray(quote.services)
              ? quote.services.filter((value): value is string => typeof value === "string")
              : [];
            if (!serviceKeys.length)
              throw new ConflictException({
                code: "QUOTE_SERVICES_MISSING",
                message: "The quote has no approved services.",
              });
            return transaction.serviceJob.create({
              data: {
                referenceNumber,
                quoteRequestId: quote.id,
                customerType: quote.propertyType,
                customerNameSnapshot: quote.customerName,
                customerEmailSnapshot: quote.customerEmail,
                customerPhoneSnapshot: quote.customerPhone,
                companyNameSnapshot: quote.companyName,
                propertyAddressLine1Snapshot: quote.addressLine1,
                propertyAddressLine2Snapshot: quote.addressLine2,
                citySnapshot: quote.city,
                serviceAreaKey: quote.serviceAreaKey,
                province: quote.province,
                postalCodeSnapshot: quote.postalCode,
                propertyTypeSnapshot: quote.propertyType,
                accessNotes: null,
                serviceScopeSummary: input.serviceScopeSummary,
                customerSchedulingNotes: null,
                internalOperationalNotes: null,
                createdByUserId: identity.userId,
                updatedByUserId: identity.userId,
                services: {
                  create: serviceKeys.map((serviceKey, sortOrder) => ({ serviceKey, sortOrder })),
                },
              },
            });
          },
          { isolationLevel: "Serializable" },
        );
        await this.record(identity.userId, job.id, "job.created_from_quote", {
          referenceNumber,
          quoteRequestId,
        });
        await this.audit.record({
          actorUserId: identity.userId,
          action: "quote-request.converted-to-job",
          resourceType: "quote-request",
          resourceId: quoteRequestId,
          metadata: { jobId: job.id, jobReference: referenceNumber },
        });
        return this.get(job.id, identity);
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          const duplicate = await this.database.client.serviceJob.findUnique({
            where: { quoteRequestId },
            select: { id: true },
          });
          if (duplicate)
            throw new ConflictException({
              code: "JOB_ALREADY_EXISTS",
              message: "This quote request already has a linked job.",
            });
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException({
      code: "JOB_REFERENCE_COLLISION",
      message: "A job reference could not be allocated.",
    });
  }

  async update(id: string, input: UpdateServiceJobInput, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_UPDATE");
    await this.ensure(id);
    const { version, ...changes } = input;
    const data: Prisma.ServiceJobUncheckedUpdateManyInput = {
      ...(changes.serviceScopeSummary !== undefined
        ? { serviceScopeSummary: changes.serviceScopeSummary }
        : {}),
      ...(changes.accessNotes !== undefined ? { accessNotes: changes.accessNotes } : {}),
      ...(changes.customerSchedulingNotes !== undefined
        ? { customerSchedulingNotes: changes.customerSchedulingNotes }
        : {}),
      ...(changes.internalOperationalNotes !== undefined
        ? { internalOperationalNotes: changes.internalOperationalNotes }
        : {}),
      ...(changes.followUpRequired !== undefined
        ? { followUpRequired: changes.followUpRequired }
        : {}),
      ...(changes.followUpNotes !== undefined ? { followUpNotes: changes.followUpNotes } : {}),
      updatedByUserId: identity.userId,
      version: { increment: 1 },
    };
    const result = await this.database.client.serviceJob.updateMany({
      where: { id, version },
      data,
    });
    if (!result.count)
      throw new ConflictException({
        code: "STALE_JOB",
        message: "This job changed elsewhere. Reload and review before saving.",
      });
    await this.record(identity.userId, id, "job.updated", { changedFields: Object.keys(changes) });
    return this.get(id, identity);
  }

  async conflicts(jobId: string, userIds: readonly string[], start: Date, end: Date) {
    if (!userIds.length) return [];
    return this.database.client.serviceJob.findMany({
      where: {
        id: { not: jobId },
        status: { notIn: inactiveConflictStatuses },
        scheduledStartAt: { lt: end },
        scheduledEndAt: { gt: start },
        assignments: { some: { userId: { in: [...userIds] }, unassignedAt: null } },
      },
      select: {
        id: true,
        referenceNumber: true,
        scheduledStartAt: true,
        scheduledEndAt: true,
        assignments: {
          where: { userId: { in: [...userIds] }, unassignedAt: null },
          select: { userId: true },
        },
      },
    });
  }

  async schedule(id: string, input: ServiceJobScheduleInput, identity: AuthenticatedIdentity) {
    const existing = await this.ensure(id);
    this.allowed(identity, existing.scheduledStartAt ? "JOBS_RESCHEDULE" : "JOBS_SCHEDULE");
    const start = vancouverLocalToUtc(input.startLocal, input.disambiguation);
    const end = new Date(start.getTime() + input.estimatedDurationMinutes * 60_000);
    const past = start < new Date();
    const assignments = await this.database.client.serviceJobAssignment.findMany({
      where: { jobId: id, unassignedAt: null },
      select: { userId: true },
    });
    const conflicts = await this.conflicts(
      id,
      assignments.map(({ userId }) => userId),
      start,
      end,
    );
    if (past && !input.overrideConflict)
      throw new ConflictException({
        code: "PAST_SCHEDULE_REQUIRES_OVERRIDE",
        message: "A past appointment requires explicit override permission and a written reason.",
      });
    if (conflicts.length && !input.overrideConflict)
      throw new ConflictException({
        code: "SCHEDULE_CONFLICT",
        message: "One or more assigned staff have an overlapping job.",
        conflicts,
      });
    if (conflicts.length || past) this.allowed(identity, "JOBS_OVERRIDE_CONFLICTS");
    const updated = await this.database.client.$transaction(async (transaction) => {
      const result = await transaction.serviceJob.updateMany({
        where: { id, version: input.version },
        data: {
          scheduledStartAt: start,
          scheduledEndAt: end,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          status:
            existing.status === "DRAFT" || existing.status === "READY_TO_SCHEDULE"
              ? "SCHEDULED"
              : existing.status,
          conflictOverrideReason:
            conflicts.length || past ? (input.conflictOverrideReason ?? null) : null,
          updatedByUserId: identity.userId,
          version: { increment: 1 },
        },
      });
      if (!result.count)
        throw new ConflictException({ code: "STALE_JOB", message: "This job changed elsewhere." });
      await transaction.serviceJobScheduleHistory.create({
        data: {
          jobId: id,
          previousStartAt: existing.scheduledStartAt,
          previousEndAt: existing.scheduledEndAt,
          newStartAt: start,
          newEndAt: end,
          changedByUserId: identity.userId,
          reason: input.reason,
          conflictOverridden: conflicts.length > 0 || past,
        },
      });
      if (existing.status === "DRAFT" || existing.status === "READY_TO_SCHEDULE")
        await transaction.serviceJobStatusHistory.create({
          data: {
            jobId: id,
            previousStatus: existing.status,
            newStatus: "SCHEDULED",
            changedByUserId: identity.userId,
            reason: "Initial schedule recorded",
          },
        });
      return transaction.serviceJob.findUniqueOrThrow({ where: { id } });
    });
    await this.record(
      identity.userId,
      id,
      existing.scheduledStartAt ? "job.rescheduled" : "job.scheduled",
      {
        previousStartAt: existing.scheduledStartAt?.toISOString(),
        newStartAt: start.toISOString(),
        newEndAt: end.toISOString(),
        conflictCount: conflicts.length,
        conflictOverridden: conflicts.length > 0 || past,
      },
    );
    return this.get(updated.id, identity);
  }

  async assign(id: string, input: ServiceJobAssignmentInput, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_ASSIGN");
    const job = await this.ensure(id);
    const user = await this.database.client.user.findFirst({
      where: { id: input.userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!user)
      throw new BadRequestException({
        code: "INVALID_ASSIGNEE",
        message: "Choose an active staff member.",
      });
    const duplicate = await this.database.client.serviceJobAssignment.findFirst({
      where: { jobId: id, userId: input.userId, unassignedAt: null },
    });
    if (duplicate)
      throw new ConflictException({
        code: "DUPLICATE_ASSIGNMENT",
        message: "This staff member is already assigned.",
      });
    if (job.scheduledStartAt && job.scheduledEndAt) {
      const conflicts = await this.conflicts(
        id,
        [input.userId],
        job.scheduledStartAt,
        job.scheduledEndAt,
      );
      if (conflicts.length)
        throw new ConflictException({
          code: "SCHEDULE_CONFLICT",
          message: "This staff member has an overlapping job.",
          conflicts,
        });
    }
    const assignment = await this.database.client.serviceJobAssignment.create({
      data: {
        jobId: id,
        userId: input.userId,
        assignmentRole: input.assignmentRole,
        assignedByUserId: identity.userId,
        notes: input.notes ?? null,
      },
    });
    await this.record(identity.userId, id, "job.assignment_added", {
      assignmentId: assignment.id,
      userId: input.userId,
      assignmentRole: input.assignmentRole,
    });
    return this.get(id, identity);
  }

  async unassign(id: string, assignmentId: string, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_ASSIGN");
    const result = await this.database.client.serviceJobAssignment.updateMany({
      where: { id: assignmentId, jobId: id, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });
    if (!result.count)
      throw new NotFoundException({
        code: "ASSIGNMENT_NOT_FOUND",
        message: "Assignment not found.",
      });
    await this.record(identity.userId, id, "job.assignment_removed", { assignmentId });
    return this.get(id, identity);
  }

  async addChecklist(
    id: string,
    input: ServiceJobChecklistItemInput,
    identity: AuthenticatedIdentity,
  ) {
    this.allowed(identity, "JOBS_MANAGE_CHECKLIST");
    await this.ensure(id);
    const last = await this.database.client.serviceJobChecklistItem.aggregate({
      where: { jobId: id },
      _max: { sortOrder: true },
    });
    const item = await this.database.client.serviceJobChecklistItem.create({
      data: {
        jobId: id,
        label: input.label,
        category: input.category,
        required: input.required,
        description: input.description ?? null,
        notes: input.notes ?? null,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
    await this.record(identity.userId, id, "job.checklist_item_created", {
      checklistItemId: item.id,
      required: item.required,
      category: item.category,
    });
    return this.get(id, identity);
  }

  async updateChecklist(
    id: string,
    itemId: string,
    input: ServiceJobChecklistUpdateInput,
    identity: AuthenticatedIdentity,
  ) {
    this.allowed(identity, "JOBS_MANAGE_CHECKLIST");
    const job = await this.ensure(id);
    if (job.version !== input.version)
      throw new ConflictException({ code: "STALE_JOB", message: "This job changed elsewhere." });
    const item = await this.database.client.serviceJobChecklistItem.findFirst({
      where: { id: itemId, jobId: id },
    });
    if (!item)
      throw new NotFoundException({
        code: "CHECKLIST_ITEM_NOT_FOUND",
        message: "Checklist item not found.",
      });
    const direction = input.direction;
    const changes = input;
    await this.database.client.$transaction(async (transaction) => {
      if (direction) {
        const neighbour = await transaction.serviceJobChecklistItem.findFirst({
          where: {
            jobId: id,
            sortOrder: direction === "up" ? { lt: item.sortOrder } : { gt: item.sortOrder },
          },
          orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
        });
        if (neighbour) {
          await transaction.serviceJobChecklistItem.update({
            where: { id: item.id },
            data: { sortOrder: -1 },
          });
          await transaction.serviceJobChecklistItem.update({
            where: { id: neighbour.id },
            data: { sortOrder: item.sortOrder },
          });
          await transaction.serviceJobChecklistItem.update({
            where: { id: item.id },
            data: { sortOrder: neighbour.sortOrder },
          });
        }
      } else {
        const data: Prisma.ServiceJobChecklistItemUncheckedUpdateInput = {
          ...(changes.completed !== undefined
            ? {
                completed: changes.completed,
                completedAt: changes.completed ? new Date() : null,
                completedByUserId: changes.completed ? identity.userId : null,
              }
            : {}),
          ...(changes.label !== undefined ? { label: changes.label } : {}),
          ...(changes.description !== undefined ? { description: changes.description } : {}),
          ...(changes.required !== undefined ? { required: changes.required } : {}),
          ...(changes.notes !== undefined ? { notes: changes.notes } : {}),
        };
        await transaction.serviceJobChecklistItem.update({ where: { id: item.id }, data });
      }
      await transaction.serviceJob.update({
        where: { id },
        data: { version: { increment: 1 }, updatedByUserId: identity.userId },
      });
    });
    await this.record(
      identity.userId,
      id,
      input.completed === undefined ? "job.checklist_item_updated" : "job.checklist_item_completed",
      { checklistItemId: itemId, completed: input.completed },
    );
    return this.get(id, identity);
  }

  async addNote(id: string, input: ServiceJobNoteInput, identity: AuthenticatedIdentity) {
    if (input.visibility === "INTERNAL") this.allowed(identity, "JOBS_ADD_INTERNAL_NOTES");
    else this.allowed(identity, "JOBS_UPDATE");
    await this.ensure(id);
    const note = await this.database.client.serviceJobNote.create({
      data: {
        jobId: id,
        authorUserId: identity.userId,
        visibility: input.visibility,
        body: input.body,
      },
    });
    await this.record(identity.userId, id, "job.note_added", {
      noteId: note.id,
      visibility: note.visibility,
    });
    return this.get(id, identity);
  }

  async updateNote(
    id: string,
    noteId: string,
    input: ServiceJobNoteUpdateInput,
    identity: AuthenticatedIdentity,
  ) {
    const note = await this.database.client.serviceJobNote.findFirst({
      where: { id: noteId, jobId: id, deletedAt: null },
    });
    if (!note)
      throw new NotFoundException({ code: "JOB_NOTE_NOT_FOUND", message: "Job note not found." });
    const permitted =
      note.visibility === "INTERNAL"
        ? hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_ADD_INTERNAL_NOTES) &&
          (note.authorUserId === identity.userId ||
            hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_UPDATE))
        : hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_UPDATE);
    if (!permitted)
      throw new NotFoundException({ code: "JOB_NOTE_NOT_FOUND", message: "Job note not found." });
    await this.database.client.serviceJobNote.update({
      where: { id: note.id },
      data: { body: input.body },
    });
    await this.record(identity.userId, id, "job.note_updated", {
      noteId,
      visibility: note.visibility,
    });
    return this.get(id, identity);
  }

  async removeNote(id: string, noteId: string, identity: AuthenticatedIdentity) {
    const note = await this.database.client.serviceJobNote.findFirst({
      where: { id: noteId, jobId: id, deletedAt: null },
    });
    if (!note)
      throw new NotFoundException({ code: "JOB_NOTE_NOT_FOUND", message: "Job note not found." });
    const permitted =
      note.visibility === "INTERNAL"
        ? hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_ADD_INTERNAL_NOTES) &&
          (note.authorUserId === identity.userId ||
            hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_UPDATE))
        : hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_UPDATE);
    if (!permitted)
      throw new NotFoundException({ code: "JOB_NOTE_NOT_FOUND", message: "Job note not found." });
    await this.database.client.serviceJobNote.update({
      where: { id: note.id },
      data: { deletedAt: new Date() },
    });
    await this.record(identity.userId, id, "job.note_deleted", {
      noteId,
      visibility: note.visibility,
    });
    return { success: true };
  }

  async addIncident(id: string, input: ServiceJobIncidentInput, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_MANAGE_INCIDENTS");
    await this.ensure(id);
    const incident = await this.database.client.serviceJobIncident.create({
      data: { jobId: id, reportedByUserId: identity.userId, ...input },
    });
    await this.record(identity.userId, id, "job.incident_created", {
      incidentId: incident.id,
      severity: incident.severity,
      blocksCompletion: incident.blocksCompletion,
    });
    return this.get(id, identity);
  }

  async updateIncident(
    id: string,
    incidentId: string,
    input: ServiceJobIncidentUpdateInput,
    identity: AuthenticatedIdentity,
  ) {
    this.allowed(identity, "JOBS_MANAGE_INCIDENTS");
    const result = await this.database.client.serviceJobIncident.updateMany({
      where: { id: incidentId, jobId: id },
      data: {
        resolutionNotes: input.resolutionNotes,
        resolvedAt: input.resolved ? new Date() : null,
        resolvedByUserId: input.resolved ? identity.userId : null,
      },
    });
    if (!result.count)
      throw new NotFoundException({ code: "INCIDENT_NOT_FOUND", message: "Incident not found." });
    await this.record(
      identity.userId,
      id,
      input.resolved ? "job.incident_resolved" : "job.incident_updated",
      { incidentId },
    );
    return this.get(id, identity);
  }

  async complete(id: string, input: ServiceJobCompletionInput, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_COMPLETE");
    const job = await this.ensure(id);
    if (
      !transitions[job.status].includes(input.followUpRequired ? "FOLLOW_UP_REQUIRED" : "COMPLETED")
    )
      throw new ConflictException({
        code: "INVALID_STATUS_TRANSITION",
        message: `${job.status} cannot be completed.`,
      });
    const [requiredIncomplete, blockingIncidents] = await Promise.all([
      this.database.client.serviceJobChecklistItem.count({
        where: { jobId: id, required: true, completed: false },
      }),
      this.database.client.serviceJobIncident.count({
        where: { jobId: id, blocksCompletion: true, resolvedAt: null },
      }),
    ]);
    if ((requiredIncomplete || blockingIncidents || !job.actualStartAt) && !input.overrideReason)
      throw new ConflictException({
        code: "COMPLETION_BLOCKED",
        message:
          "Complete required checklist items, resolve blocking incidents, and start service first.",
        requiredIncomplete,
        blockingIncidents,
        missingActualStart: !job.actualStartAt,
      });
    if (requiredIncomplete || blockingIncidents || !job.actualStartAt)
      this.allowed(identity, "JOBS_OVERRIDE_COMPLETION");
    const nextStatus = input.followUpRequired ? "FOLLOW_UP_REQUIRED" : "COMPLETED";
    await this.transition(
      id,
      {
        version: input.version,
        status: nextStatus,
        reason: "Service completed",
        overrideReason: input.overrideReason,
      },
      identity,
      {
        completionSummary: input.completionSummary,
        followUpRequired: input.followUpRequired,
        followUpNotes: input.followUpNotes ?? null,
        actualEndAt: new Date(),
        completedAt: new Date(),
      },
    );
    return this.get(id, identity);
  }

  async cancel(id: string, input: ServiceJobCancellationInput, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_CANCEL");
    const result = await this.transition(
      id,
      { version: input.version, status: "CANCELLED", reason: input.reason },
      identity,
      {
        cancellationReason: input.reason,
        cancelledAt: new Date(),
        ...(input.customerNote ? { customerSchedulingNotes: input.customerNote } : {}),
      },
    );
    return result;
  }

  async changeStatus(
    id: string,
    input: ServiceJobStatusTransitionInput,
    identity: AuthenticatedIdentity,
  ) {
    if (["COMPLETED", "FOLLOW_UP_REQUIRED"].includes(input.status))
      throw new BadRequestException({
        code: "USE_COMPLETION_ACTION",
        message: "Use the completion action so all completion requirements are validated.",
      });
    if (input.status === "CANCELLED") this.allowed(identity, "JOBS_CANCEL");
    else if (input.status === "CLOSED") this.allowed(identity, "JOBS_CLOSE");
    else if (input.status === "ARCHIVED") this.allowed(identity, "JOBS_ARCHIVE");
    else this.allowed(identity, "JOBS_CHANGE_STATUS");
    const timestamps: Prisma.ServiceJobUpdateManyMutationInput =
      input.status === "ARRIVED"
        ? { actualArrivalAt: new Date() }
        : input.status === "IN_PROGRESS"
          ? { actualStartAt: new Date() }
          : input.status === "CLOSED"
            ? { closedAt: new Date() }
            : input.status === "ARCHIVED"
              ? { archivedAt: new Date() }
              : {};
    return this.transition(id, input, identity, timestamps);
  }

  private async transition(
    id: string,
    input: ServiceJobStatusTransitionInput,
    identity: AuthenticatedIdentity,
    extra: Prisma.ServiceJobUpdateManyMutationInput = {},
  ) {
    const job = await this.ensure(id);
    if (!transitions[job.status].includes(input.status))
      throw new ConflictException({
        code: "INVALID_STATUS_TRANSITION",
        message: `${job.status} cannot move to ${input.status}.`,
      });
    if (input.status === "SCHEDULED" && !job.scheduledStartAt)
      throw new ConflictException({
        code: "SCHEDULE_REQUIRED",
        message: "Record an appointment before scheduling.",
      });
    if (input.status === "CONFIRMED") {
      const assignees = await this.database.client.serviceJobAssignment.count({
        where: { jobId: id, unassignedAt: null },
      });
      if (!assignees)
        throw new ConflictException({
          code: "ASSIGNMENT_REQUIRED",
          message: "Assign at least one active staff member before confirming.",
        });
    }
    if (input.status === "CANCELLED" && !input.reason)
      throw new BadRequestException({
        code: "CANCELLATION_REASON_REQUIRED",
        message: "A cancellation reason is required.",
      });
    const result = await this.database.client.$transaction(async (transaction) => {
      const update = await transaction.serviceJob.updateMany({
        where: { id, version: input.version },
        data: {
          status: input.status,
          ...extra,
          updatedByUserId: identity.userId,
          version: { increment: 1 },
        },
      });
      if (!update.count)
        throw new ConflictException({ code: "STALE_JOB", message: "This job changed elsewhere." });
      await transaction.serviceJobStatusHistory.create({
        data: {
          jobId: id,
          previousStatus: job.status,
          newStatus: input.status,
          changedByUserId: identity.userId,
          reason: input.reason ?? input.overrideReason ?? null,
        },
      });
      return transaction.serviceJob.findUniqueOrThrow({ where: { id } });
    });
    const actionByStatus: Partial<Record<ServiceJobStatus, string>> = {
      ARRIVED: "job.arrived",
      IN_PROGRESS: job.status === "PAUSED" ? "job.resumed" : "job.started",
      PAUSED: "job.paused",
      COMPLETED: "job.completed",
      FOLLOW_UP_REQUIRED: "job.completed",
      CANCELLED: "job.cancelled",
      CLOSED: "job.closed",
      ARCHIVED: "job.archived",
    };
    const action = actionByStatus[input.status] ?? "job.status_changed";
    await this.record(identity.userId, id, action, {
      from: job.status,
      to: input.status,
      overrideUsed: Boolean(input.overrideReason),
    });
    return this.get(result.id, identity);
  }

  async remove(id: string, identity: AuthenticatedIdentity) {
    this.allowed(identity, "JOBS_DELETE");
    const job = await this.ensure(id);
    if (!["DRAFT", "ARCHIVED"].includes(job.status))
      throw new ConflictException({
        code: "JOB_NOT_DELETABLE",
        message: "Only Draft or Archived jobs may be hard-deleted.",
      });
    const media = await this.database.client.serviceJobMedia.count({
      where: { jobId: id, removedAt: null },
    });
    if (media)
      throw new ConflictException({
        code: "JOB_MEDIA_REQUIRES_CLEANUP",
        message: "Remove private media before deleting this job.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "job.deleted",
      resourceType: "service-job",
      resourceId: id,
      metadata: { referenceNumber: job.referenceNumber },
    });
    await this.database.client.serviceJob.delete({ where: { id } });
    return { success: true };
  }
}
