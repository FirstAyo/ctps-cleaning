import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@ctps/database";
import type {
  BeforeAfterMediaOrderInput,
  CreateBeforeAfterProjectInput,
  UpdateBeforeAfterProjectInput,
} from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";
import { LocalMediaStorageService } from "./local-media-storage.service";
import { MediaConfigService } from "./media-config.service";

const mediaPublicSelect = {
  id: true,
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
  supportingMedia: {
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
    include: { media: { select: mediaPublicSelect } },
  },
} satisfies Prisma.BeforeAfterProjectInclude;

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
          ...project.supportingMedia.map((item) => item.mediaId),
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
  }
  private date(value: string | null | undefined) {
    return value ? new Date(value) : null;
  }
  private async validateMedia(ids: readonly string[], currentProjectId?: string) {
    if (!ids.length) return;
    if (ids.length !== new Set(ids).size)
      throw new ConflictException({
        code: "DUPLICATE_MEDIA",
        message: "An image can appear only once within a project.",
      });
    const media = await this.database.client.mediaAsset.findMany({
      where: { id: { in: [...ids] }, status: "READY" },
      select: {
        id: true,
        visibility: true,
        primaryBeforeFor: { select: { id: true } },
        primaryAfterFor: { select: { id: true } },
        projectLinks: { select: { projectId: true } },
      },
    });
    if (media.length !== ids.length)
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
        ...item.projectLinks.map(({ projectId }) => projectId),
      ].some((id) => id !== currentProjectId);
      if (other)
        throw new ConflictException({
          code: "MEDIA_ALREADY_REFERENCED",
          message: "A managed image cannot be shared between projects.",
        });
    }
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

  async create(input: CreateBeforeAfterProjectInput, actorUserId: string) {
    const supportIds = input.supportingMedia.map((item) => item.mediaId);
    const ids = [input.primaryBeforeMediaId, input.primaryAfterMediaId, ...supportIds].filter(
      (id): id is string => Boolean(id),
    );
    if (supportIds.length > this.config.value.MEDIA_MAX_PROJECT_SUPPORTING_IMAGES)
      throw new BadRequestException({
        code: "TOO_MANY_SUPPORTING_IMAGES",
        message: "The supporting-image limit was exceeded.",
      });
    await this.validateMedia(ids);
    const duplicate = await this.database.client.beforeAfterProject.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException({
        code: "SLUG_CONFLICT",
        message: "Another project already uses this slug.",
      });
    const project = await this.database.client.beforeAfterProject.create({
      data: {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        description: input.description,
        serviceKey: input.serviceKey,
        serviceAreaKey: input.serviceAreaKey,
        completedAt: this.date(input.completedAt),
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        featured: input.featured,
        primaryBeforeMediaId: input.primaryBeforeMediaId ?? null,
        primaryAfterMediaId: input.primaryAfterMediaId ?? null,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
        supportingMedia: {
          create: input.supportingMedia.map((item) => ({
            mediaId: item.mediaId,
            category: item.category,
            sortOrder: item.sortOrder,
            caption: item.caption || null,
          })),
        },
      },
      include: projectInclude,
    });
    await this.audit.record({
      actorUserId,
      action: "before_after_project.created",
      resourceType: "before_after_project",
      resourceId: project.id,
      metadata: {
        slug: project.slug,
        serviceKey: project.serviceKey,
        serviceAreaKey: project.serviceAreaKey,
        mediaCount: ids.length,
      },
    });
    return this.response(project);
  }

  async update(id: string, input: UpdateBeforeAfterProjectInput, actorUserId: string) {
    const current = await this.find(id);
    if (
      current.status === "PUBLISHED" &&
      (input.slug !== undefined ||
        input.primaryBeforeMediaId !== undefined ||
        input.primaryAfterMediaId !== undefined ||
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
    const support =
      input.supportingMedia ??
      current.supportingMedia.map((item) => ({
        mediaId: item.mediaId,
        category: item.category,
        sortOrder: item.sortOrder,
        caption: item.caption,
      }));
    await this.validateMedia(
      [primaryBefore, primaryAfter, ...support.map((item) => item.mediaId)].filter(
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
      status: "PUBLISHED",
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
      where: { slug, status: "PUBLISHED" },
      include: projectInclude,
    });
    if (!project)
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        message: "The project was not found.",
      });
    return this.response(project);
  }
}
