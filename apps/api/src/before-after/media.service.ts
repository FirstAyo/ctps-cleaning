import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { BeforeAfterMediaUpdateInput } from "@ctps/validation";

import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";
import { ImageProcessingService, type ProcessedUpload } from "./image-processing.service";
import { LocalMediaStorageService, type StorageVisibility } from "./local-media-storage.service";
import { MediaConfigService } from "./media-config.service";

const kinds = ["ORIGINAL", "LARGE", "GALLERY", "THUMBNAIL"] as const;
export type VariantKind = (typeof kinds)[number];
function variantKind(value: string): VariantKind | null {
  const normalized = value.toUpperCase();
  return kinds.find((kind) => kind === normalized) ?? null;
}

@Injectable()
export class BeforeAfterMediaService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ImageProcessingService) private readonly processor: ImageProcessingService,
    @Inject(LocalMediaStorageService) private readonly storage: LocalMediaStorageService,
    @Inject(MediaConfigService) private readonly config: MediaConfigService,
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
      createdAt: media.createdAt,
      variants: media.variants.map((item) => ({
        kind: item.kind,
        width: item.width,
        height: item.height,
        path: `/media/before-after/${media.id}/${item.kind.toLowerCase()}`,
      })),
    };
  }

  async upload(files: Express.Multer.File[], actorUserId: string) {
    const limits = this.config.value;
    if (!files.length)
      throw new BadRequestException({
        code: "FILES_REQUIRED",
        message: "Select at least one image.",
      });
    if (files.length > limits.MEDIA_MAX_UPLOAD_FILES)
      throw new BadRequestException({
        code: "TOO_MANY_FILES",
        message: `Upload no more than ${limits.MEDIA_MAX_UPLOAD_FILES} images at once.`,
      });
    if (files.reduce((total, file) => total + file.size, 0) > limits.MEDIA_MAX_TOTAL_UPLOAD_BYTES)
      throw new BadRequestException({
        code: "UPLOAD_TOO_LARGE",
        message: "The combined upload exceeds the request-size limit.",
      });
    const processed: ProcessedUpload[] = [];
    try {
      for (const file of files) processed.push(await this.processor.process(file));
    } catch (error) {
      await Promise.all(processed.map((item) => this.storage.deleteMedia("PRIVATE", item.id)));
      throw error;
    }
    try {
      const created = await this.database.client.$transaction(
        processed.map((item) =>
          this.database.client.mediaAsset.create({
            data: {
              id: item.id,
              storageKey: item.storageKey,
              visibility: "PRIVATE",
              status: "READY",
              originalFilename: item.originalFilename,
              storedFilename: item.storedFilename,
              mimeType: item.mimeType,
              sizeBytes: item.sizeBytes,
              width: item.width,
              height: item.height,
              checksum: item.checksum,
              uploadedByUserId: actorUserId,
              variants: { create: item.variants.map((variant) => variant) },
            },
            include: { variants: { orderBy: { kind: "asc" } } },
          }),
        ),
      );
      for (const media of created)
        await this.audit.record({
          actorUserId,
          action: "before_after_media.uploaded",
          resourceType: "before_after_media",
          resourceId: media.id,
          metadata: {
            mimeType: media.mimeType,
            sizeBytes: media.sizeBytes,
            width: media.width,
            height: media.height,
          },
        });
      return { items: created.map((media) => this.response(media)) };
    } catch {
      await Promise.all(processed.map((item) => this.storage.deleteMedia("PRIVATE", item.id)));
      throw new BadRequestException({
        code: "MEDIA_RECORD_FAILED",
        message: "The images could not be saved. No uploaded files were retained.",
      });
    }
  }

  async update(id: string, input: BeforeAfterMediaUpdateInput, actorUserId: string) {
    const existing = await this.database.client.mediaAsset.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing)
      throw new NotFoundException({
        code: "MEDIA_NOT_FOUND",
        message: "The managed image was not found.",
      });
    const media = await this.database.client.mediaAsset.update({
      where: { id },
      data: {
        ...(input.altText !== undefined ? { altText: input.altText } : {}),
        ...(input.caption !== undefined ? { caption: input.caption || null } : {}),
      },
      include: { variants: true },
    });
    await this.audit.record({
      actorUserId,
      action: "before_after_media.updated",
      resourceType: "before_after_media",
      resourceId: id,
      metadata: { changedFields: Object.keys(input) },
    });
    return this.response(media);
  }

  async remove(id: string, actorUserId: string) {
    const media = await this.database.client.mediaAsset.findUnique({
      where: { id },
      select: {
        id: true,
        visibility: true,
        primaryBeforeFor: { select: { id: true }, take: 1 },
        primaryAfterFor: { select: { id: true }, take: 1 },
        projectLinks: { select: { id: true }, take: 1 },
      },
    });
    if (!media)
      throw new NotFoundException({
        code: "MEDIA_NOT_FOUND",
        message: "The managed image was not found.",
      });
    if (media.primaryBeforeFor.length || media.primaryAfterFor.length || media.projectLinks.length)
      throw new ConflictException({
        code: "MEDIA_REFERENCED",
        message: "Remove this image from its project before deleting it.",
      });
    await this.database.client.mediaAsset.delete({ where: { id } });
    await this.storage.deleteMedia(media.visibility as StorageVisibility, id);
    await this.audit.record({
      actorUserId,
      action: "before_after_media.removed",
      resourceType: "before_after_media",
      resourceId: id,
    });
    return { success: true };
  }

  async file(id: string, kindInput: string, publicOnly: boolean) {
    const kind = variantKind(kindInput);
    if (!kind)
      throw new NotFoundException({
        code: "MEDIA_NOT_FOUND",
        message: "The managed image was not found.",
      });
    const media = await this.database.client.mediaAsset.findUnique({
      where: { id },
      select: {
        id: true,
        visibility: true,
        status: true,
        variants: {
          where: { kind },
          select: { storageKey: true, mimeType: true, sizeBytes: true },
        },
      },
    });
    if (!media || media.status !== "READY" || (publicOnly && media.visibility !== "PUBLIC"))
      throw new NotFoundException({
        code: "MEDIA_NOT_FOUND",
        message: "The managed image was not found.",
      });
    const variant = media.variants[0];
    if (!variant)
      throw new NotFoundException({
        code: "MEDIA_NOT_FOUND",
        message: "The managed image was not found.",
      });
    try {
      const data = await this.storage.read(media.visibility, variant.storageKey);
      return {
        data,
        mimeType: variant.mimeType,
        sizeBytes: variant.sizeBytes,
        cacheControl: publicOnly ? "public, max-age=31536000, immutable" : "private, no-store",
        filename: `${id}-${kind.toLowerCase()}.webp`,
      };
    } catch {
      throw new NotFoundException({
        code: "MEDIA_NOT_FOUND",
        message: "The managed image was not found.",
      });
    }
  }
}
