import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@ctps/database";
import { PERMISSION_KEYS } from "@ctps/permissions";
import type {
  BeforeAfterMediaOrderInput,
  CreateBeforeAfterProjectInput,
  UpdateBeforeAfterProjectInput,
} from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { LocalMediaStorageService } from "./local-media-storage.service";
import { MediaConfigService } from "./media-config.service";

const mediaPublicSelect = {
  id: true,
  originalFilename: true,
  altText: true,
  caption: true,
  width: true,
  height: true,
  visibility: true,
  status: true,
  variants: { select: { kind: true, width: true, height: true } },
} as const;
const projectInclude = {
  primaryBeforeMedia: { select: mediaPublicSelect },
  primaryAfterMedia: { select: mediaPublicSelect },
  coverMedia: { select: mediaPublicSelect },
  supportingMedia: {
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
    include: { media: { select: mediaPublicSelect } },
  },
} satisfies Prisma.BeforeAfterProjectInclude;

const publicProjectOrder = [
  { completedAt: { sort: "desc" as const, nulls: "last" as const } },
  { publishedAt: { sort: "desc" as const, nulls: "last" as const } },
  { createdAt: "desc" as const },
  { id: "asc" as const },
];
const publicProjectVisibilityWhere = {
  status: "PUBLISHED" as const,
  primaryBeforeMedia: { is: { visibility: "PUBLIC" as const, status: "READY" as const } },
  primaryAfterMedia: { is: { visibility: "PUBLIC" as const, status: "READY" as const } },
  OR: [
    { coverMediaId: null },
    { coverMedia: { is: { visibility: "PUBLIC" as const, status: "READY" as const } } },
  ],
  supportingMedia: {
    every: { media: { visibility: "PUBLIC" as const, status: "READY" as const } },
  },
} satisfies Prisma.BeforeAfterProjectWhereInput;

@Injectable()
export class BeforeAfterProjectsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(LocalMediaStorageService) private readonly storage: LocalMediaStorageService,
    @Inject(MediaConfigService) private readonly config: MediaConfigService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private mediaResponse(
    media: {
      id: string;
      originalFilename: string;
      altText: string;
      caption: string | null;
      width: number;
      height: number;
      variants: readonly { kind: string; width: number; height: number }[];
    } | null,
  ) {
    if (!media) return null;
    return {
      id: media.id,
      originalFilename: media.originalFilename,
      altText: media.altText,
      caption: media.caption,
      width: media.width,
      height: media.height,
      variants: Object.fromEntries(
        media.variants.map((variant) => [
          variant.kind.toLowerCase(),
          {
            path: `/media/before-after/${media.id}/${variant.kind.toLowerCase()}`,
            width: variant.width,
            height: variant.height,
          },
        ]),
      ),
    };
  }
  private response(project: Awaited<ReturnType<BeforeAfterProjectsService["find"]>>) {
    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      description: project.description,
      summaryContent: project.summaryContent,
      descriptionContent: project.descriptionContent,
      status: project.status,
      featured: project.featured,
      publishedAt: project.publishedAt,
      completedAt: project.completedAt,
      serviceKey: project.serviceKey,
      serviceAreaKey: project.serviceAreaKey,
      seoTitle: project.seoTitle,
      seoDescription: project.seoDescription,
      displayOrder: project.displayOrder,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      primaryBeforeMedia: this.mediaResponse(project.primaryBeforeMedia),
      primaryAfterMedia: this.mediaResponse(project.primaryAfterMedia),
      coverMedia: this.mediaResponse(project.coverMedia),
      supportingMedia: project.supportingMedia.map((link) => ({
        id: link.id,
        category: link.category,
        sortOrder: link.sortOrder,
        caption: link.caption,
        media: this.mediaResponse(link.media),
      })),
    };
  }
  private async find(id: string) {
    const project = await this.database.client.beforeAfterProject.findUnique({
      where: { id },
      include: projectInclude,
    });
    if (!project)
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "The before-and-after project was not found.",
      });
    return project;
  }
  private mediaIds(project: Awaited<ReturnType<BeforeAfterProjectsService["find"]>>) {
    return [
      ...new Set(
        [
          project.primaryBeforeMediaId,
          project.primaryAfterMediaId,
          project.coverMediaId,
          ...project.supportingMedia.map((item) => item.mediaId),
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
  }
  private date(value: string | null | undefined) {
    return value ? new Date(value) : null;
  }
  private validateRoleIds(ids: readonly (string | null | undefined)[]) {
    const selected = ids.filter((id): id is string => Boolean(id));
    if (selected.length !== new Set(selected).size)
      throw new ConflictException({
        code: "DUPLICATE_MEDIA",
        message: "An image can appear only once within the Before, After, and gallery roles.",
      });
  }
  private async validateMedia(ids: readonly string[], currentProjectId?: string) {
    if (!ids.length) return;
    const uniqueIds = [...new Set(ids)];
    const media = await this.database.client.mediaAsset.findMany({
      where: { id: { in: uniqueIds }, status: "READY" },
      select: {
        id: true,
        altText: true,
        visibility: true,
        primaryBeforeFor: { select: { id: true } },
        primaryAfterFor: { select: { id: true } },
        coverFor: { select: { id: true } },
        projectLinks: { select: { projectId: true } },
      },
    });
    if (media.length !== uniqueIds.length)
      throw new ConflictException({
        code: "MEDIA_UNAVAILABLE",
        message: "One or more selected images are unavailable.",
      });
    for (const item of media) {
      if (item.visibility !== "PRIVATE" && !currentProjectId)
        throw new ConflictException({
          code: "MEDIA_VISIBILITY_CONFLICT",
          message: "Only private uploaded images may be attached to a draft.",
        });
      const other = [
        ...item.primaryBeforeFor.map(({ id }) => id),
        ...item.primaryAfterFor.map(({ id }) => id),
        ...item.coverFor.map(({ id }) => id),
        ...item.projectLinks.map(({ projectId }) => projectId),
      ].some((id) => id !== currentProjectId);
      if (other)
        throw new ConflictException({
          code: "MEDIA_ALREADY_REFERENCED",
          message: "A managed image cannot be shared between projects.",
        });
    }
    return media;
  }

  async list(query: {
    page: number;
    pageSize: number;
    search?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    serviceKey?: string;
    serviceAreaKey?: string;
    featured?: boolean;
  }) {
    const where: Prisma.BeforeAfterProjectWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.serviceKey ? { serviceKey: query.serviceKey } : {}),
      ...(query.serviceAreaKey ? { serviceAreaKey: query.serviceAreaKey } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.beforeAfterProject.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.count({ where }),
    ]);
    return {
      items: items.map((item) => this.response(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
  async get(id: string) {
    return this.response(await this.find(id));
  }

  async create(input: CreateBeforeAfterProjectInput, actor: AuthenticatedIdentity) {
    const actorUserId = actor.userId;
    if (
      input.intent === "PUBLISH" &&
      !actor.permissions.includes(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_PUBLISH)
    )
      throw new ForbiddenException({
        code: "PERMISSION_DENIED",
        message: "You do not have permission to publish projects.",
      });
    const supportIds = input.supportingMedia.map((item) => item.mediaId);
    this.validateRoleIds([input.primaryBeforeMediaId, input.primaryAfterMediaId, ...supportIds]);
    if (input.coverMediaId && input.coverMediaId === input.primaryBeforeMediaId)
      throw new ConflictException({
        code: "COVER_ROLE_CONFLICT",
        message: "Use the After photo or a dedicated image for the project cover.",
      });
    const ids = [
      input.primaryBeforeMediaId,
      input.primaryAfterMediaId,
      input.coverMediaId,
      ...supportIds,
    ].filter((id): id is string => Boolean(id));
    if (supportIds.length > this.config.value.MEDIA_MAX_PROJECT_SUPPORTING_IMAGES)
      throw new BadRequestException({
        code: "TOO_MANY_SUPPORTING_IMAGES",
        message: "The supporting-image limit was exceeded.",
      });
    const media = (await this.validateMedia(ids)) ?? [];
    const duplicate = await this.database.client.beforeAfterProject.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException({
        code: "SLUG_CONFLICT",
        message: "Another project already uses this slug.",
      });
    if (input.intent === "PUBLISH") {
      const fields: string[] = [];
      if (!input.summary.trim()) fields.push("summary");
      if (!input.description.trim()) fields.push("description");
      if (!input.primaryBeforeMediaId) fields.push("primary Before image");
      else if (!media.find(({ id }) => id === input.primaryBeforeMediaId)?.altText.trim())
        fields.push("primary Before alt text");
      if (!input.primaryAfterMediaId) fields.push("primary After image");
      else if (!media.find(({ id }) => id === input.primaryAfterMediaId)?.altText.trim())
        fields.push("primary After alt text");
      if (fields.length)
        throw new BadRequestException({
          code: "PUBLISH_VALIDATION_FAILED",
          message: `Complete these publication requirements: ${fields.join(", ")}.`,
          fields,
        });
    }
    const moved: string[] = [];
    try {
      if (input.intent === "PUBLISH")
        for (const mediaId of [...new Set(ids)]) {
          await this.storage.moveMedia(mediaId, "PRIVATE", "PUBLIC");
          moved.push(mediaId);
        }
      const createData: Prisma.BeforeAfterProjectCreateInput = {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        description: input.description,
        ...(input.summaryContent !== undefined
          ? { summaryContent: input.summaryContent ?? Prisma.JsonNull }
          : {}),
        ...(input.descriptionContent !== undefined
          ? { descriptionContent: input.descriptionContent ?? Prisma.JsonNull }
          : {}),
        serviceKey: input.serviceKey,
        serviceAreaKey: input.serviceAreaKey,
        completedAt: this.date(input.completedAt),
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        featured: input.featured,
        status: input.intent === "PUBLISH" ? "PUBLISHED" : "DRAFT",
        publishedAt: input.intent === "PUBLISH" ? new Date() : null,
        createdBy: { connect: { id: actorUserId } },
        updatedBy: { connect: { id: actorUserId } },
        ...(input.primaryBeforeMediaId
          ? { primaryBeforeMedia: { connect: { id: input.primaryBeforeMediaId } } }
          : {}),
        ...(input.primaryAfterMediaId
          ? { primaryAfterMedia: { connect: { id: input.primaryAfterMediaId } } }
          : {}),
        ...(input.coverMediaId ? { coverMedia: { connect: { id: input.coverMediaId } } } : {}),
        supportingMedia: {
          create: input.supportingMedia.map((item) => ({
            mediaId: item.mediaId,
            category: item.category,
            sortOrder: item.sortOrder,
            caption: item.caption || null,
          })),
        },
      };
      const project =
        input.intent === "PUBLISH"
          ? await this.database.client.$transaction(async (transaction) => {
              await transaction.mediaAsset.updateMany({
                where: { id: { in: [...new Set(ids)] } },
                data: { visibility: "PUBLIC" },
              });
              const created = await transaction.beforeAfterProject.create({
                data: createData,
                include: projectInclude,
              });
              await transaction.auditLog.createMany({
                data: [
                  {
                    actorUserId,
                    action: "before_after_project.created",
                    resourceType: "before_after_project",
                    resourceId: created.id,
                    metadata: {
                      slug: created.slug,
                      serviceKey: created.serviceKey,
                      serviceAreaKey: created.serviceAreaKey,
                      mediaCount: new Set(ids).size,
                      intent: input.intent,
                    },
                  },
                  {
                    actorUserId,
                    action: "before_after_project.published",
                    resourceType: "before_after_project",
                    resourceId: created.id,
                    metadata: {
                      previousStatus: null,
                      mediaCount: new Set(ids).size,
                      direct: true,
                    },
                  },
                ],
              });
              return created;
            })
          : await this.database.client.beforeAfterProject.create({
              data: createData,
              include: projectInclude,
            });
      if (input.intent === "SAVE_DRAFT")
        await this.audit.record({
          actorUserId,
          action: "before_after_project.created",
          resourceType: "before_after_project",
          resourceId: project.id,
          metadata: {
            slug: project.slug,
            serviceKey: project.serviceKey,
            serviceAreaKey: project.serviceAreaKey,
            mediaCount: new Set(ids).size,
            intent: input.intent,
          },
        });
      return this.response(project);
    } catch (error) {
      await Promise.all(
        moved.map((mediaId) =>
          this.storage.moveMedia(mediaId, "PUBLIC", "PRIVATE").catch(() => undefined),
        ),
      );
      throw error;
    }
  }

  async update(id: string, input: UpdateBeforeAfterProjectInput, actorUserId: string) {
    const current = await this.find(id);
    if (
      current.status === "PUBLISHED" &&
      (input.slug !== undefined ||
        input.primaryBeforeMediaId !== undefined ||
        input.primaryAfterMediaId !== undefined ||
        input.coverMediaId !== undefined ||
        input.supportingMedia !== undefined)
    )
      throw new ConflictException({
        code: "UNPUBLISH_REQUIRED",
        message: "Unpublish the project before changing its slug or media.",
      });
    if (
      input.slug &&
      input.slug !== current.slug &&
      (await this.database.client.beforeAfterProject.findFirst({
        where: { slug: input.slug, id: { not: id } },
        select: { id: true },
      }))
    )
      throw new ConflictException({
        code: "SLUG_CONFLICT",
        message: "Another project already uses this slug.",
      });
    if (
      input.supportingMedia &&
      input.supportingMedia.length > this.config.value.MEDIA_MAX_PROJECT_SUPPORTING_IMAGES
    )
      throw new BadRequestException({
        code: "TOO_MANY_SUPPORTING_IMAGES",
        message: "The supporting-image limit was exceeded.",
      });
    const primaryBefore =
      input.primaryBeforeMediaId === undefined
        ? current.primaryBeforeMediaId
        : input.primaryBeforeMediaId;
    const primaryAfter =
      input.primaryAfterMediaId === undefined
        ? current.primaryAfterMediaId
        : input.primaryAfterMediaId;
    const cover = input.coverMediaId === undefined ? current.coverMediaId : input.coverMediaId;
    const support =
      input.supportingMedia ??
      current.supportingMedia.map((item) => ({
        mediaId: item.mediaId,
        category: item.category,
        sortOrder: item.sortOrder,
        caption: item.caption,
      }));
    this.validateRoleIds([primaryBefore, primaryAfter, ...support.map((item) => item.mediaId)]);
    if (cover && cover === primaryBefore)
      throw new ConflictException({
        code: "COVER_ROLE_CONFLICT",
        message: "Use the After photo or a dedicated image for the project cover.",
      });
    await this.validateMedia(
      [primaryBefore, primaryAfter, cover, ...support.map((item) => item.mediaId)].filter(
        (mediaId): mediaId is string => Boolean(mediaId),
      ),
      id,
    );
    const project = await this.database.client.$transaction(async (transaction) => {
      const result = await transaction.beforeAfterProject.updateMany({
        where: { id, version: input.version },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.summary !== undefined ? { summary: input.summary } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.summaryContent !== undefined
            ? { summaryContent: input.summaryContent ?? Prisma.JsonNull }
            : {}),
          ...(input.descriptionContent !== undefined
            ? { descriptionContent: input.descriptionContent ?? Prisma.JsonNull }
            : {}),
          ...(input.serviceKey !== undefined ? { serviceKey: input.serviceKey } : {}),
          ...(input.serviceAreaKey !== undefined ? { serviceAreaKey: input.serviceAreaKey } : {}),
          ...(input.completedAt !== undefined ? { completedAt: this.date(input.completedAt) } : {}),
          ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle || null } : {}),
          ...(input.seoDescription !== undefined
            ? { seoDescription: input.seoDescription || null }
            : {}),
          ...(input.featured !== undefined ? { featured: input.featured } : {}),
          ...(input.primaryBeforeMediaId !== undefined
            ? { primaryBeforeMediaId: input.primaryBeforeMediaId }
            : {}),
          ...(input.primaryAfterMediaId !== undefined
            ? { primaryAfterMediaId: input.primaryAfterMediaId }
            : {}),
          ...(input.coverMediaId !== undefined ? { coverMediaId: input.coverMediaId } : {}),
          updatedByUserId: actorUserId,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new ConflictException({
          code: "PROJECT_VERSION_CONFLICT",
          message: "This project changed after it was opened. Refresh before saving again.",
        });
      if (input.supportingMedia !== undefined) {
        await transaction.beforeAfterProjectMedia.deleteMany({ where: { projectId: id } });
        if (support.length)
          await transaction.beforeAfterProjectMedia.createMany({
            data: support.map((item) => ({
              projectId: id,
              mediaId: item.mediaId,
              category: item.category,
              sortOrder: item.sortOrder,
              caption: item.caption || null,
            })),
          });
      }
      return transaction.beforeAfterProject.findUniqueOrThrow({
        where: { id },
        include: projectInclude,
      });
    });
    await this.audit.record({
      actorUserId,
      action: "before_after_project.updated",
      resourceType: "before_after_project",
      resourceId: id,
      metadata: { changedFields: Object.keys(input).filter((key) => key !== "version") },
    });
    return this.response(project);
  }

  async reorder(id: string, input: BeforeAfterMediaOrderInput, actorUserId: string) {
    const result = await this.update(
      id,
      { version: input.version, supportingMedia: input.items },
      actorUserId,
    );
    await this.audit.record({
      actorUserId,
      action: "before_after_media.reordered",
      resourceType: "before_after_project",
      resourceId: id,
      metadata: { mediaIds: input.items.map(({ mediaId }) => mediaId) },
    });
    return result;
  }

  private validatePublish(project: Awaited<ReturnType<BeforeAfterProjectsService["find"]>>) {
    const errors: string[] = [];
    if (!project.title.trim()) errors.push("title");
    if (!project.summary.trim()) errors.push("summary");
    if (!project.description.trim()) errors.push("description");
    if (!project.primaryBeforeMedia) errors.push("primary Before image");
    else if (!project.primaryBeforeMedia.altText.trim()) errors.push("primary Before alt text");
    if (!project.primaryAfterMedia) errors.push("primary After image");
    else if (!project.primaryAfterMedia.altText.trim()) errors.push("primary After alt text");
    if (project.supportingMedia.some((item) => item.media.status !== "READY"))
      errors.push("ready supporting images");
    if (errors.length)
      throw new BadRequestException({
        code: "PUBLISH_VALIDATION_FAILED",
        message: `Complete these publication requirements: ${errors.join(", ")}.`,
        fields: errors,
      });
  }
  async publish(id: string, actorUserId: string) {
    const project = await this.find(id);
    if (project.status === "ARCHIVED")
      throw new ConflictException({
        code: "ARCHIVED_PROJECT",
        message: "Archived projects cannot be published.",
      });
    this.validatePublish(project);
    const ids = this.mediaIds(project);
    const moved: string[] = [];
    try {
      for (const mediaId of ids) {
        const media = [
          project.primaryBeforeMedia,
          project.primaryAfterMedia,
          project.coverMedia,
          ...project.supportingMedia.map((item) => item.media),
        ].find((item) => item?.id === mediaId);
        if (media?.visibility === "PRIVATE") {
          await this.storage.moveMedia(mediaId, "PRIVATE", "PUBLIC");
          moved.push(mediaId);
        }
      }
      const updated = await this.database.client.$transaction(async (transaction) => {
        await transaction.mediaAsset.updateMany({
          where: { id: { in: ids } },
          data: { visibility: "PUBLIC" },
        });
        return transaction.beforeAfterProject.update({
          where: { id },
          data: {
            status: "PUBLISHED",
            publishedAt: project.publishedAt ?? new Date(),
            archivedAt: null,
            updatedByUserId: actorUserId,
            version: { increment: 1 },
          },
          include: projectInclude,
        });
      });
      await this.audit.record({
        actorUserId,
        action: "before_after_project.published",
        resourceType: "before_after_project",
        resourceId: id,
        metadata: { previousStatus: project.status, mediaCount: ids.length },
      });
      return this.response(updated);
    } catch (error) {
      await Promise.all(
        moved.map((mediaId) =>
          this.storage.moveMedia(mediaId, "PUBLIC", "PRIVATE").catch(() => undefined),
        ),
      );
      throw error;
    }
  }
  private async makePrivate(
    project: Awaited<ReturnType<BeforeAfterProjectsService["find"]>>,
    status: "DRAFT" | "ARCHIVED",
    actorUserId: string,
  ) {
    const ids = this.mediaIds(project);
    const updated = await this.database.client.$transaction(async (transaction) => {
      await transaction.mediaAsset.updateMany({
        where: { id: { in: ids } },
        data: { visibility: "PRIVATE" },
      });
      return transaction.beforeAfterProject.update({
        where: { id: project.id },
        data: {
          status,
          archivedAt: status === "ARCHIVED" ? new Date() : null,
          updatedByUserId: actorUserId,
          version: { increment: 1 },
        },
        include: projectInclude,
      });
    });
    try {
      for (const mediaId of ids)
        if (await this.storage.exists("PUBLIC", `${mediaId}/original.webp`))
          await this.storage.moveMedia(mediaId, "PUBLIC", "PRIVATE");
    } catch {
      throw new ConflictException({
        code: "MEDIA_TRANSITION_FAILED",
        message:
          "The project is private, but media movement requires operator recovery before further editing.",
      });
    }
    return updated;
  }
  async unpublish(id: string, actorUserId: string) {
    const project = await this.find(id);
    if (project.status !== "PUBLISHED")
      throw new ConflictException({
        code: "PROJECT_NOT_PUBLISHED",
        message: "Only published projects can be unpublished.",
      });
    const updated = await this.makePrivate(project, "DRAFT", actorUserId);
    await this.audit.record({
      actorUserId,
      action: "before_after_project.unpublished",
      resourceType: "before_after_project",
      resourceId: id,
      metadata: { mediaCount: this.mediaIds(project).length },
    });
    return this.response(updated);
  }
  async archive(id: string, actorUserId: string) {
    const project = await this.find(id);
    if (project.status === "ARCHIVED") return this.response(project);
    const updated =
      project.status === "PUBLISHED"
        ? await this.makePrivate(project, "ARCHIVED", actorUserId)
        : await this.database.client.beforeAfterProject.update({
            where: { id },
            data: {
              status: "ARCHIVED",
              archivedAt: new Date(),
              updatedByUserId: actorUserId,
              version: { increment: 1 },
            },
            include: projectInclude,
          });
    await this.audit.record({
      actorUserId,
      action: "before_after_project.archived",
      resourceType: "before_after_project",
      resourceId: id,
      metadata: { previousStatus: project.status },
    });
    return this.response(updated);
  }
  async remove(id: string, actorUserId: string) {
    const project = await this.find(id);
    if (project.status !== "DRAFT")
      throw new ConflictException({
        code: "ARCHIVE_OR_UNPUBLISH_REQUIRED",
        message: "Only draft projects can be deleted. Unpublish or archive first.",
      });
    await this.database.client.beforeAfterProject.delete({ where: { id } });
    await this.audit.record({
      actorUserId,
      action: "before_after_project.deleted",
      resourceType: "before_after_project",
      resourceId: id,
      metadata: { slug: project.slug },
    });
    return { success: true };
  }

  async publicList(query: {
    page: number;
    pageSize: number;
    serviceKey?: string;
    serviceAreaKey?: string;
    featured?: boolean;
  }) {
    const where: Prisma.BeforeAfterProjectWhereInput = {
      ...publicProjectVisibilityWhere,
      ...(query.serviceKey ? { serviceKey: query.serviceKey } : {}),
      ...(query.serviceAreaKey ? { serviceAreaKey: query.serviceAreaKey } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.beforeAfterProject.findMany({
        where,
        orderBy: [
          { featured: "desc" },
          { displayOrder: "asc" },
          { publishedAt: "desc" },
          { id: "asc" },
        ],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.count({ where }),
    ]);
    return {
      items: items.map((item) => this.response(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
  async publicGet(slug: string) {
    const project = await this.database.client.beforeAfterProject.findFirst({
      where: { ...publicProjectVisibilityWhere, slug },
      include: projectInclude,
    });
    if (!project)
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "The project was not found.",
      });
    return this.response(project);
  }

  async publicContext(slug: string) {
    const project = await this.database.client.beforeAfterProject.findFirst({
      where: { ...publicProjectVisibilityWhere, slug },
      include: projectInclude,
    });
    if (!project)
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "The project was not found.",
      });

    const excludeCurrent = { ...publicProjectVisibilityWhere, id: { not: project.id } };
    const relatedTiers = await Promise.all([
      this.database.client.beforeAfterProject.findMany({
        where: {
          ...excludeCurrent,
          serviceKey: project.serviceKey,
          serviceAreaKey: project.serviceAreaKey,
        },
        orderBy: publicProjectOrder,
        take: 3,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.findMany({
        where: { ...excludeCurrent, serviceKey: project.serviceKey },
        orderBy: publicProjectOrder,
        take: 3,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.findMany({
        where: { ...excludeCurrent, serviceAreaKey: project.serviceAreaKey },
        orderBy: publicProjectOrder,
        take: 3,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.findMany({
        where: excludeCurrent,
        orderBy: publicProjectOrder,
        take: 3,
        include: projectInclude,
      }),
    ]);
    const related = [] as (typeof project)[];
    const relatedIds = new Set<string>();
    for (const candidate of relatedTiers.flat()) {
      if (related.length === 3) break;
      if (!relatedIds.has(candidate.id)) {
        related.push(candidate);
        relatedIds.add(candidate.id);
      }
    }

    const [more, previous, next] = await Promise.all([
      this.database.client.beforeAfterProject.findMany({
        where: {
          ...publicProjectVisibilityWhere,
          id: { notIn: [project.id, ...relatedIds] },
        },
        orderBy: publicProjectOrder,
        take: 3,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.findMany({
        where: publicProjectVisibilityWhere,
        cursor: { id: project.id },
        skip: 1,
        take: -1,
        orderBy: publicProjectOrder,
        include: projectInclude,
      }),
      this.database.client.beforeAfterProject.findMany({
        where: publicProjectVisibilityWhere,
        cursor: { id: project.id },
        skip: 1,
        take: 1,
        orderBy: publicProjectOrder,
        include: projectInclude,
      }),
    ]);

    return {
      project: this.response(project),
      relatedProjects: related.map((item) => this.response(item)),
      moreProjects: more.map((item) => this.response(item)),
      previousProject: previous[0] ? this.response(previous[0]) : null,
      nextProject: next[0] ? this.response(next[0]) : null,
    };
  }
}
