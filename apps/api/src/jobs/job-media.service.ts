import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ServiceJobMediaMetadataInput, ServiceJobMediaUpdateInput } from "@ctps/validation";
import { PERMISSION_KEYS, hasPermission } from "@ctps/permissions";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { DatabaseService } from "../database/database.service";
import { JobsService } from "./jobs.service";
import { JobsConfigService } from "./jobs-config.service";
import { JobImageService } from "./job-image.service";
import { JobStorageService } from "./job-storage.service";

const kinds = ["ORIGINAL", "LARGE", "STANDARD", "THUMBNAIL"] as const;
@Injectable()
export class JobMediaService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(JobsService) private readonly jobs: JobsService,
    @Inject(JobsConfigService) private readonly config: JobsConfigService,
    @Inject(JobImageService) private readonly images: JobImageService,
    @Inject(JobStorageService) private readonly storage: JobStorageService,
  ) {}
  async upload(
    jobId: string,
    files: Express.Multer.File[],
    input: ServiceJobMediaMetadataInput,
    identity: AuthenticatedIdentity,
  ) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_UPLOAD_PRIVATE_MEDIA))
      throw new NotFoundException({ code: "JOB_NOT_FOUND", message: "Job not found." });
    await this.jobs.get(jobId, identity);
    const limits = this.config.value;
    if (!files.length || files.length > limits.JOBS_MAX_UPLOAD_FILES)
      throw new BadRequestException({
        code: "JOB_MEDIA_COUNT",
        message: `Select between 1 and ${limits.JOBS_MAX_UPLOAD_FILES} images.`,
      });
    if (files.reduce((sum, file) => sum + file.size, 0) > limits.JOBS_MAX_TOTAL_UPLOAD_BYTES)
      throw new BadRequestException({
        code: "JOB_MEDIA_TOTAL",
        message: "The combined upload is too large.",
      });
    const last = await this.database.client.serviceJobMedia.aggregate({
      where: { jobId },
      _max: { sortOrder: true },
    });
    const processed = [];
    try {
      for (const file of files) processed.push(await this.images.process(file));
      const created = await this.database.client.$transaction(
        processed.map((item, index) =>
          this.database.client.serviceJobMedia.create({
            data: {
              id: item.id,
              jobId,
              storageKey: item.storageKey,
              originalFilename: item.originalFilename,
              mimeType: item.mimeType,
              sizeBytes: item.sizeBytes,
              width: item.width,
              height: item.height,
              checksum: item.checksum,
              category: input.category,
              altText: input.altText,
              caption: input.caption ?? null,
              sortOrder: (last._max.sortOrder ?? -1) + index + 1,
              uploadedByUserId: identity.userId,
              variants: { create: item.variants },
            },
            select: {
              id: true,
              originalFilename: true,
              category: true,
              altText: true,
              caption: true,
              width: true,
              height: true,
              sortOrder: true,
            },
          }),
        ),
      );
      for (const media of created)
        await this.jobs.record(identity.userId, jobId, "job.media_uploaded", {
          mediaId: media.id,
          category: media.category,
          width: media.width,
          height: media.height,
        });
      return { items: created };
    } catch (error) {
      await Promise.all(processed.map((item) => this.storage.remove(item.id)));
      throw error;
    }
  }
  async file(
    jobId: string,
    mediaId: string,
    variantInput: string,
    identity: AuthenticatedIdentity,
  ) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_READ_PRIVATE_MEDIA))
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    await this.jobs.get(jobId, identity);
    const normalized = variantInput.toUpperCase().replaceAll("-", "_");
    const kind = kinds.find((value) => value === normalized);
    if (!kind)
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    const media = await this.database.client.serviceJobMedia.findFirst({
      where: { id: mediaId, jobId, removedAt: null },
      include: { variants: { where: { kind } } },
    });
    const variant = media?.variants[0];
    if (!media || !variant)
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    try {
      return {
        data: await this.storage.read(variant.storageKey),
        mimeType: variant.mimeType,
        sizeBytes: variant.sizeBytes,
        filename: `${media.id}-${variantInput}.webp`,
      };
    } catch {
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    }
  }
  async update(
    jobId: string,
    mediaId: string,
    input: ServiceJobMediaUpdateInput,
    identity: AuthenticatedIdentity,
  ) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_UPLOAD_PRIVATE_MEDIA))
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    await this.jobs.get(jobId, identity);
    const media = await this.database.client.serviceJobMedia.findFirst({
      where: { id: mediaId, jobId, removedAt: null },
    });
    if (!media)
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    if (input.direction) {
      const neighbour = await this.database.client.serviceJobMedia.findFirst({
        where: {
          jobId,
          removedAt: null,
          sortOrder: input.direction === "up" ? { lt: media.sortOrder } : { gt: media.sortOrder },
        },
        orderBy: { sortOrder: input.direction === "up" ? "desc" : "asc" },
      });
      if (neighbour)
        await this.database.client.$transaction([
          this.database.client.serviceJobMedia.update({
            where: { id: media.id },
            data: { sortOrder: -1 },
          }),
          this.database.client.serviceJobMedia.update({
            where: { id: neighbour.id },
            data: { sortOrder: media.sortOrder },
          }),
          this.database.client.serviceJobMedia.update({
            where: { id: media.id },
            data: { sortOrder: neighbour.sortOrder },
          }),
        ]);
    } else
      await this.database.client.serviceJobMedia.update({
        where: { id: media.id },
        data: {
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.altText !== undefined ? { altText: input.altText } : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
        },
      });
    await this.jobs.record(identity.userId, jobId, "job.media_updated", {
      mediaId,
      changedFields: Object.keys(input),
    });
    return { success: true };
  }
  async remove(jobId: string, mediaId: string, identity: AuthenticatedIdentity) {
    if (!hasPermission(identity.permissions, PERMISSION_KEYS.JOBS_DELETE_PRIVATE_MEDIA))
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    await this.jobs.get(jobId, identity);
    const media = await this.database.client.serviceJobMedia.findFirst({
      where: { id: mediaId, jobId, removedAt: null },
    });
    if (!media)
      throw new NotFoundException({ code: "JOB_MEDIA_NOT_FOUND", message: "Job image not found." });
    await this.database.client.serviceJobMedia.update({
      where: { id: media.id },
      data: { removedAt: new Date() },
    });
    await this.storage.remove(media.id);
    await this.jobs.record(identity.userId, jobId, "job.media_deleted", { mediaId });
    return { success: true };
  }
}
