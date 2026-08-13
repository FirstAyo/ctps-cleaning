import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { hasPermission, PERMISSION_KEYS } from "@ctps/permissions";
import type { BlogMediaListQuery, BlogMediaUpdateInput } from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { BlogConfigService } from "./blog-config.service";
import { BlogImageService, type ProcessedBlogImage } from "./blog-image.service";
import { BlogStorageService, type BlogStorageVisibility } from "./blog-storage.service";

const kinds = ["ORIGINAL", "FEATURED", "ARTICLE_LARGE", "ARTICLE_STANDARD", "THUMBNAIL"] as const;

@Injectable()
export class BlogMediaService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(BlogConfigService) private readonly config: BlogConfigService,
    @Inject(BlogImageService) private readonly images: BlogImageService,
    @Inject(BlogStorageService) private readonly storage: BlogStorageService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private response(media: {
    id: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
    altText: string;
    caption: string | null;
    visibility: string;
    uploadedByUserId: string;
    createdAt: Date;
    variants: readonly { kind: string; width: number; height: number }[];
  }) {
    return {
      id: media.id,
      originalFilename: media.originalFilename,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      width: media.width,
      height: media.height,
      altText: media.altText,
      caption: media.caption,
      visibility: media.visibility,
      ownedByCurrentUser: undefined,
      createdAt: media.createdAt,
      variants: Object.fromEntries(
        media.variants.map((variant) => [
          variant.kind.toLowerCase().replaceAll("_", "-"),
          {
            path: `/media/blog/${media.id}/${variant.kind.toLowerCase().replaceAll("_", "-")}`,
            width: variant.width,
            height: variant.height,
          },
        ]),
      ),
    };
  }

  private canManage(
    identity: AuthenticatedIdentity,
    ownerId: string,
    action: "read" | "update" | "delete",
  ) {
    const all = {
      read: PERMISSION_KEYS.BLOG_MEDIA_READ_ALL,
      update: PERMISSION_KEYS.BLOG_MEDIA_UPDATE_ALL,
      delete: PERMISSION_KEYS.BLOG_MEDIA_DELETE_ALL,
    }[action];
    const own = {
      read: PERMISSION_KEYS.BLOG_MEDIA_READ_OWN,
      update: PERMISSION_KEYS.BLOG_MEDIA_UPDATE_OWN,
      delete: PERMISSION_KEYS.BLOG_MEDIA_DELETE_OWN,
    }[action];
    return (
      hasPermission(identity.permissions, all) ||
      (identity.userId === ownerId && hasPermission(identity.permissions, own))
    );
  }

  async list(query: BlogMediaListQuery, identity: AuthenticatedIdentity) {
    const readAll = hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_MEDIA_READ_ALL);
    if (!readAll && !hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_MEDIA_READ_OWN))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot read blog media." });
    const where = {
      status: "READY" as const,
      ...(!readAll ? { uploadedByUserId: identity.userId } : {}),
      ...(query.search
        ? { originalFilename: { contains: query.search, mode: "insensitive" as const } }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.blogMediaAsset.findMany({
        where,
        include: { variants: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.database.client.blogMediaAsset.count({ where }),
    ]);
    return { items: items.map((item) => this.response(item)), total, page: query.page };
  }

  async upload(files: Express.Multer.File[], identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_MEDIA_UPLOAD_OWN))
      throw new ForbiddenException({ code: "FORBIDDEN", message: "You cannot upload blog media." });
    const limits = this.config.value;
    if (!files.length || files.length > limits.BLOG_MAX_UPLOAD_FILES)
      throw new BadRequestException({
        code: "BLOG_MEDIA_COUNT",
        message: `Select between 1 and ${limits.BLOG_MAX_UPLOAD_FILES} images.`,
      });
    if (files.reduce((sum, file) => sum + file.size, 0) > limits.BLOG_MAX_TOTAL_UPLOAD_BYTES)
      throw new BadRequestException({
        code: "BLOG_MEDIA_TOTAL",
        message: "The combined blog upload is too large.",
      });
    const processed: ProcessedBlogImage[] = [];
    try {
      for (const file of files) processed.push(await this.images.process(file));
      const created = await this.database.client.$transaction(
        processed.map((item) =>
          this.database.client.blogMediaAsset.create({
            data: {
              id: item.id,
              storageKey: item.storageKey,
              originalFilename: item.originalFilename,
              mimeType: item.mimeType,
              sizeBytes: item.sizeBytes,
              width: item.width,
              height: item.height,
              checksum: item.checksum,
              uploadedByUserId: identity.userId,
              variants: { create: item.variants },
            },
            include: { variants: true },
          }),
        ),
      );
      for (const media of created)
        await this.audit.record({
          actorUserId: identity.userId,
          action: "blog_media.uploaded",
          resourceType: "blog_media",
          resourceId: media.id,
          metadata: {
            mimeType: media.mimeType,
            sizeBytes: media.sizeBytes,
            width: media.width,
            height: media.height,
          },
        });
      return { items: created.map((item) => this.response(item)) };
    } catch (error) {
      await Promise.all(processed.map((item) => this.storage.remove(item.id, "PRIVATE")));
      throw error;
    }
  }

  async update(id: string, input: BlogMediaUpdateInput, identity: AuthenticatedIdentity) {
    const existing = await this.database.client.blogMediaAsset.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing || !this.canManage(identity, existing.uploadedByUserId, "update"))
      throw new NotFoundException({
        code: "BLOG_MEDIA_NOT_FOUND",
        message: "The blog image was not found.",
      });
    const updated = await this.database.client.blogMediaAsset.update({
      where: { id },
      data: {
        ...(input.altText !== undefined ? { altText: input.altText } : {}),
        ...(input.caption !== undefined ? { caption: input.caption || null } : {}),
      },
      include: { variants: true },
    });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_media.updated",
      resourceType: "blog_media",
      resourceId: id,
      metadata: { changedFields: Object.keys(input) },
    });
    return this.response(updated);
  }

  async remove(id: string, identity: AuthenticatedIdentity) {
    const media = await this.database.client.blogMediaAsset.findUnique({
      where: { id },
      include: { postLinks: { take: 1 }, featuredFor: { take: 1 }, authorProfiles: { take: 1 } },
    });
    if (!media || !this.canManage(identity, media.uploadedByUserId, "delete"))
      throw new NotFoundException({
        code: "BLOG_MEDIA_NOT_FOUND",
        message: "The blog image was not found.",
      });
    if (media.postLinks.length || media.featuredFor.length || media.authorProfiles.length)
      throw new ConflictException({
        code: "BLOG_MEDIA_REFERENCED",
        message: "Remove this image from every blog reference before deleting it.",
      });
    await this.database.client.blogMediaAsset.delete({ where: { id } });
    await this.storage.remove(id, media.visibility as BlogStorageVisibility);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "blog_media.deleted",
      resourceType: "blog_media",
      resourceId: id,
    });
    return { success: true };
  }

  async file(id: string, kindInput: string, publicOnly: boolean, identity?: AuthenticatedIdentity) {
    const normalized = kindInput.toUpperCase().replaceAll("-", "_");
    const kind = kinds.find((candidate) => candidate === normalized);
    if (!kind)
      throw new NotFoundException({
        code: "BLOG_MEDIA_NOT_FOUND",
        message: "The blog image was not found.",
      });
    const media = await this.database.client.blogMediaAsset.findUnique({
      where: { id },
      include: { variants: { where: { kind } } },
    });
    if (
      !media ||
      media.status !== "READY" ||
      (publicOnly && media.visibility !== "PUBLIC") ||
      (!publicOnly && (!identity || !this.canManage(identity, media.uploadedByUserId, "read")))
    )
      throw new NotFoundException({
        code: "BLOG_MEDIA_NOT_FOUND",
        message: "The blog image was not found.",
      });
    const variant = media.variants[0];
    if (!variant)
      throw new NotFoundException({
        code: "BLOG_MEDIA_NOT_FOUND",
        message: "The blog image was not found.",
      });
    try {
      return {
        data: await this.storage.read(media.visibility, variant.storageKey),
        mimeType: variant.mimeType,
        sizeBytes: variant.sizeBytes,
        filename: `${id}-${kindInput}.webp`,
        cacheControl: publicOnly ? "public, max-age=31536000, immutable" : "private, no-store",
      };
    } catch {
      throw new NotFoundException({
        code: "BLOG_MEDIA_NOT_FOUND",
        message: "The blog image was not found.",
      });
    }
  }

  async validateOwned(ids: readonly string[], identity: AuthenticatedIdentity) {
    const unique = [...new Set(ids)];
    const media = await this.database.client.blogMediaAsset.findMany({
      where: { id: { in: unique }, status: "READY" },
    });
    if (
      media.length !== unique.length ||
      media.some(
        (item) =>
          item.uploadedByUserId !== identity.userId &&
          !hasPermission(identity.permissions, PERMISSION_KEYS.BLOG_MEDIA_READ_ALL),
      )
    )
      throw new ConflictException({
        code: "BLOG_MEDIA_UNAVAILABLE",
        message: "One or more blog images are unavailable to this author.",
      });
    return media;
  }

  async publish(ids: readonly string[]) {
    for (const media of await this.database.client.blogMediaAsset.findMany({
      where: { id: { in: [...new Set(ids)] } },
    })) {
      if (media.visibility === "PRIVATE") {
        await this.storage.move(media.id, "PRIVATE", "PUBLIC");
        await this.database.client.blogMediaAsset.update({
          where: { id: media.id },
          data: { visibility: "PUBLIC" },
        });
      }
    }
  }

  async revokeUnused(ids: readonly string[], excludingPostId: string) {
    for (const id of [...new Set(ids)]) {
      const media = await this.database.client.blogMediaAsset.findUnique({
        where: { id },
        include: {
          postLinks: {
            where: { post: { status: "PUBLISHED", id: { not: excludingPostId } } },
            take: 1,
          },
          featuredFor: { where: { status: "PUBLISHED", id: { not: excludingPostId } }, take: 1 },
          authorProfiles: {
            where: { user: { blogPosts: { some: { status: "PUBLISHED" } } } },
            take: 1,
          },
        },
      });
      if (
        media?.visibility === "PUBLIC" &&
        !media.postLinks.length &&
        !media.featuredFor.length &&
        !media.authorProfiles.length
      ) {
        await this.database.client.blogMediaAsset.update({
          where: { id },
          data: { visibility: "PRIVATE" },
        });
        await this.storage.move(id, "PUBLIC", "PRIVATE");
      }
    }
  }
}
