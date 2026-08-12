import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@ctps/database";
import {
  apiEnvironmentSchema,
  type PublicMediaListQuery,
  type PublicMediaUpdateInput,
} from "@ctps/validation";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import sharp from "sharp";

import { AuditService } from "../auth/audit.service";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";

const kinds = ["ORIGINAL", "HERO", "LARGE", "STANDARD", "CARD", "THUMBNAIL"] as const;
const specifications = [
  ["ORIGINAL", "original", 3200, 92],
  ["HERO", "hero", 2400, 90],
  ["LARGE", "large", 1800, 88],
  ["STANDARD", "standard", 1200, 84],
  ["CARD", "card", 800, 82],
  ["THUMBNAIL", "thumbnail", 360, 76],
] as const;
const mimeByExtension = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

function signature(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return "jpg";
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "png";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

function safeFailure(error: unknown) {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === "object" && response && "message" in response)
      return String(response.message);
  }
  return "The image could not be processed.";
}

@Injectable()
export class MarketingMediaService {
  private readonly config = apiEnvironmentSchema.parse(process.env);
  private readonly root = resolve(process.cwd(), this.config.MARKETING_MEDIA_PUBLIC_ROOT);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private path(key: string) {
    if (!/^[0-9a-f-]{36}\/(?:original|hero|large|standard|card|thumbnail)\.webp$/.test(key))
      throw new Error("Invalid managed marketing-media key");
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`))
      throw new Error("Marketing-media path escaped its root");
    return target;
  }

  private response(media: {
    id: string;
    originalFilename: string;
    title: string;
    altText: string;
    caption: string | null;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
    focalPointX: number;
    focalPointY: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date | null;
    variants: readonly {
      kind: string;
      width: number;
      height: number;
      sizeBytes: number;
      mimeType: string;
    }[];
    uploader?: { displayName: string };
    _count?: { pageReferences: number; socialImageFor: number };
  }) {
    return {
      id: media.id,
      originalFilename: media.originalFilename,
      title: media.title,
      altText: media.altText,
      caption: media.caption,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      width: media.width,
      height: media.height,
      focalPointX: media.focalPointX,
      focalPointY: media.focalPointY,
      status: media.status,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      archivedAt: media.archivedAt,
      uploadedBy: media.uploader?.displayName,
      usageCount: (media._count?.pageReferences ?? 0) + (media._count?.socialImageFor ?? 0),
      variants: Object.fromEntries(
        media.variants.map((variant) => [
          variant.kind.toLowerCase(),
          {
            path: `/media/marketing/${media.id}/${variant.kind.toLowerCase()}`,
            width: variant.width,
            height: variant.height,
            sizeBytes: variant.sizeBytes,
            mimeType: variant.mimeType,
          },
        ]),
      ),
    };
  }

  async list(query: PublicMediaListQuery) {
    const where: Prisma.PublicMediaAssetWhereInput = { status: query.status };
    if (query.search)
      where.OR = ["title", "originalFilename", "altText"].map((field) => ({
        [field]: { contains: query.search, mode: "insensitive" },
      }));
    if (query.filter === "RECENT")
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    if (query.filter === "USED")
      where.AND = [{ OR: [{ pageReferences: { some: {} } }, { socialImageFor: { some: {} } }] }];
    if (query.filter === "UNUSED")
      where.AND = [{ pageReferences: { none: {} } }, { socialImageFor: { none: {} } }];
    // Prisma cannot portably compare two columns. Orientation filters are applied to a bounded
    // candidate window while all search/status filters remain parameterized in PostgreSQL.
    const orientation = ["LANDSCAPE", "PORTRAIT", "SQUARE"].includes(query.filter);
    const include = {
      variants: true,
      _count: { select: { pageReferences: true, socialImageFor: true } },
    } as const;
    const candidates = orientation
      ? await this.database.client.publicMediaAsset.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 480,
          include,
        })
      : await this.database.client.publicMediaAsset.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include,
        });
    const filtered = orientation
      ? candidates.filter((item) => {
          if (query.filter === "LANDSCAPE") return item.width > item.height;
          if (query.filter === "PORTRAIT") return item.height > item.width;
          return Math.abs(item.width / item.height - 1) <= 0.08;
        })
      : candidates;
    const total = orientation
      ? filtered.length
      : await this.database.client.publicMediaAsset.count({ where });
    const items = orientation
      ? filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
      : filtered;
    return {
      items: items.map((item) => this.response(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async detail(id: string) {
    const media = await this.database.client.publicMediaAsset.findUnique({
      where: { id },
      include: {
        variants: true,
        uploader: { select: { displayName: true } },
        _count: { select: { pageReferences: true, socialImageFor: true } },
      },
    });
    if (!media)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    return this.response(media);
  }

  async usage(id: string) {
    const media = await this.database.client.publicMediaAsset.findUnique({
      where: { id },
      select: {
        id: true,
        pageReferences: {
          orderBy: [{ page: { title: "asc" } }, { usage: "asc" }],
          select: {
            usage: true,
            sortOrder: true,
            page: { select: { pageKey: true, title: true, slug: true } },
          },
        },
        socialImageFor: { select: { pageKey: true, title: true, slug: true } },
      },
    });
    if (!media)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    return {
      items: [
        ...media.pageReferences.map((reference) => ({
          pageKey: reference.page.pageKey,
          pageTitle: reference.page.title,
          pageSlug: reference.page.slug,
          usage: reference.usage,
          sortOrder: reference.sortOrder,
        })),
        ...media.socialImageFor.map((page) => ({
          pageKey: page.pageKey,
          pageTitle: page.title,
          pageSlug: page.slug,
          usage: "SOCIAL_IMAGE",
          sortOrder: 0,
        })),
      ],
    };
  }

  private async process(file: Express.Multer.File) {
    if (
      !file.buffer?.length ||
      file.size > this.config.MARKETING_MEDIA_MAX_FILE_BYTES ||
      file.buffer.length > this.config.MARKETING_MEDIA_MAX_FILE_BYTES
    )
      throw new BadRequestException({
        code: "INVALID_PUBLIC_IMAGE",
        message: "The image is empty or too large.",
      });
    const detected = signature(file.buffer);
    const suffix = file.originalname.split(".").pop()?.toLowerCase();
    const extension = suffix === "jpeg" ? "jpg" : suffix;
    if (!detected || extension !== detected || file.mimetype !== mimeByExtension.get(detected))
      throw new BadRequestException({
        code: "UNSUPPORTED_PUBLIC_IMAGE",
        message: "Use a valid JPEG, PNG, or WebP image whose filename and content agree.",
      });
    let width = 0;
    let height = 0;
    try {
      const metadata = await sharp(file.buffer, {
        failOn: "error",
        limitInputPixels:
          this.config.MARKETING_MEDIA_MAX_WIDTH * this.config.MARKETING_MEDIA_MAX_HEIGHT,
      }).metadata();
      width = metadata.autoOrient?.width ?? metadata.width ?? 0;
      height = metadata.autoOrient?.height ?? metadata.height ?? 0;
    } catch {
      throw new BadRequestException({
        code: "CORRUPT_PUBLIC_IMAGE",
        message: "The image could not be decoded safely.",
      });
    }
    if (
      width < this.config.MARKETING_MEDIA_MIN_WIDTH ||
      height < this.config.MARKETING_MEDIA_MIN_HEIGHT ||
      width > this.config.MARKETING_MEDIA_MAX_WIDTH ||
      height > this.config.MARKETING_MEDIA_MAX_HEIGHT
    )
      throw new BadRequestException({
        code: "PUBLIC_IMAGE_DIMENSIONS",
        message: "The image dimensions are outside the supported range.",
      });

    const id = randomUUID();
    const variants: Array<{
      kind: (typeof kinds)[number];
      storageKey: string;
      mimeType: string;
      sizeBytes: number;
      width: number;
      height: number;
    }> = [];
    try {
      for (const [kind, filename, targetWidth, quality] of specifications) {
        const output = await sharp(file.buffer, {
          failOn: "error",
          limitInputPixels:
            this.config.MARKETING_MEDIA_MAX_WIDTH * this.config.MARKETING_MEDIA_MAX_HEIGHT,
        })
          .rotate()
          .resize({ width: targetWidth, fit: "inside", withoutEnlargement: true })
          .webp({ quality, effort: 4 })
          .toBuffer({ resolveWithObject: true });
        const storageKey = `${id}/${filename}.webp`;
        const target = this.path(storageKey);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, output.data, { flag: "wx" });
        variants.push({
          kind,
          storageKey,
          mimeType: "image/webp",
          sizeBytes: output.data.length,
          width: output.info.width,
          height: output.info.height,
        });
      }
    } catch {
      await rm(resolve(this.root, id), { recursive: true, force: true }).catch(() => undefined);
      throw new BadRequestException({
        code: "PUBLIC_IMAGE_PROCESSING_FAILED",
        message: "The image could not be processed.",
      });
    }
    return {
      id,
      originalFilename:
        file.originalname
          .replaceAll("\\", "/")
          .split("/")
          .pop()
          ?.replaceAll(/[^\p{L}\p{N}._ -]/gu, "_")
          .slice(0, 255) ?? "image",
      checksum: createHash("sha256").update(file.buffer).digest("hex"),
      variants,
    };
  }

  async upload(files: Express.Multer.File[], identity: AuthenticatedIdentity) {
    if (!files.length || files.length > this.config.MARKETING_MEDIA_MAX_UPLOAD_FILES)
      throw new BadRequestException({
        code: "PUBLIC_MEDIA_COUNT",
        message: `Select between 1 and ${this.config.MARKETING_MEDIA_MAX_UPLOAD_FILES} images.`,
      });
    if (
      files.reduce((sum, file) => sum + Math.max(file.size, file.buffer?.length ?? 0), 0) >
      this.config.MARKETING_MEDIA_MAX_TOTAL_UPLOAD_BYTES
    )
      throw new BadRequestException({
        code: "PUBLIC_MEDIA_TOTAL",
        message: "The combined upload is too large.",
      });

    const items: ReturnType<MarketingMediaService["response"]>[] = [];
    const failures: Array<{ filename: string; message: string }> = [];
    for (const file of files) {
      let processed: Awaited<ReturnType<MarketingMediaService["process"]>> | null = null;
      try {
        processed = await this.process(file);
        const original = processed.variants[0]!;
        const created = await this.database.client.publicMediaAsset.create({
          data: {
            id: processed.id,
            originalFilename: processed.originalFilename,
            title: processed.originalFilename
              .replace(/\.[^.]+$/, "")
              .replaceAll(/[-_]+/g, " ")
              .slice(0, 160),
            altText: "",
            mimeType: "image/webp",
            sizeBytes: original.sizeBytes,
            width: original.width,
            height: original.height,
            checksum: processed.checksum,
            uploadedByUserId: identity.userId,
            variants: { create: processed.variants },
          },
          include: { variants: true },
        });
        await this.audit.record({
          actorUserId: identity.userId,
          action: "public_media.uploaded",
          resourceType: "public_media",
          resourceId: created.id,
          metadata: { sizeBytes: created.sizeBytes, width: created.width, height: created.height },
        });
        items.push(this.response(created));
      } catch (error) {
        if (processed)
          await rm(resolve(this.root, processed.id), { recursive: true, force: true }).catch(
            () => undefined,
          );
        failures.push({ filename: file.originalname.slice(0, 255), message: safeFailure(error) });
      }
    }
    return { items, failures };
  }

  async update(id: string, input: PublicMediaUpdateInput, identity: AuthenticatedIdentity) {
    const existing = await this.database.client.publicMediaAsset.findUnique({ where: { id } });
    if (!existing)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    const updated = await this.database.client.publicMediaAsset.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.altText !== undefined ? { altText: input.altText } : {}),
        ...(input.caption !== undefined ? { caption: input.caption || null } : {}),
        ...(input.focalPointX !== undefined ? { focalPointX: input.focalPointX } : {}),
        ...(input.focalPointY !== undefined ? { focalPointY: input.focalPointY } : {}),
      },
      include: {
        variants: true,
        _count: { select: { pageReferences: true, socialImageFor: true } },
      },
    });
    await this.audit.record({
      actorUserId: identity.userId,
      action:
        input.focalPointX !== undefined || input.focalPointY !== undefined
          ? "public_media.focal_point_updated"
          : "public_media.updated",
      resourceType: "public_media",
      resourceId: id,
      metadata: { changedFields: Object.keys(input) },
    });
    return this.response(updated);
  }

  async archive(id: string, identity: AuthenticatedIdentity) {
    const result = await this.database.client.publicMediaAsset.updateMany({
      where: { id, status: "READY" },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    if (!result.count)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The active public image was not found.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "public_media.archived",
      resourceType: "public_media",
      resourceId: id,
    });
    return this.detail(id);
  }

  async restore(id: string, identity: AuthenticatedIdentity) {
    const result = await this.database.client.publicMediaAsset.updateMany({
      where: { id, status: "ARCHIVED" },
      data: { status: "READY", archivedAt: null },
    });
    if (!result.count)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The archived public image was not found.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "public_media.restored",
      resourceType: "public_media",
      resourceId: id,
    });
    return this.detail(id);
  }

  async remove(id: string, identity: AuthenticatedIdentity) {
    const existing = await this.database.client.publicMediaAsset.findUnique({
      where: { id },
      include: { _count: { select: { pageReferences: true, socialImageFor: true } } },
    });
    if (!existing)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    const usageCount = existing._count.pageReferences + existing._count.socialImageFor;
    if (usageCount)
      throw new ConflictException({
        code: "PUBLIC_MEDIA_REFERENCED",
        message: `This image is currently used in ${usageCount} place${usageCount === 1 ? "" : "s"}. Remove or replace those references first.`,
      });
    await this.database.client.publicMediaAsset.delete({ where: { id } });
    await rm(resolve(this.root, id), { recursive: true, force: true }).catch(() => undefined);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "public_media.deleted",
      resourceType: "public_media",
      resourceId: id,
    });
    return { success: true };
  }

  async file(id: string, kindInput: string) {
    const normalized = kindInput.toUpperCase();
    const kind = kinds.find((candidate) => candidate === normalized);
    if (!kind)
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    const media = await this.database.client.publicMediaAsset.findUnique({
      where: { id },
      include: { variants: { where: { kind } } },
    });
    if (!media || !media.variants[0])
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    const variant = media.variants[0];
    try {
      return {
        data: await readFile(this.path(variant.storageKey)),
        mimeType: variant.mimeType,
        sizeBytes: variant.sizeBytes,
        filename: `${id}-${kindInput}.webp`,
      };
    } catch {
      throw new NotFoundException({
        code: "PUBLIC_MEDIA_NOT_FOUND",
        message: "The public image was not found.",
      });
    }
  }
}
