import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { JobsConfigService } from "./jobs-config.service";
import { JobStorageService } from "./job-storage.service";

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

@Injectable()
export class JobImageService {
  constructor(
    @Inject(JobsConfigService) private readonly config: JobsConfigService,
    @Inject(JobStorageService) private readonly storage: JobStorageService,
  ) {}
  async process(file: Express.Multer.File) {
    const limits = this.config.value;
    if (!file.buffer?.length || file.size > limits.JOBS_MAX_FILE_BYTES)
      throw new BadRequestException({
        code: "INVALID_JOB_IMAGE",
        message: "The image is empty or too large.",
      });
    const detected = signature(file.buffer);
    const extension =
      file.originalname.split(".").pop()?.toLowerCase() === "jpeg"
        ? "jpg"
        : file.originalname.split(".").pop()?.toLowerCase();
    if (!detected || extension !== detected || file.mimetype !== mimeByExtension.get(detected))
      throw new BadRequestException({
        code: "UNSUPPORTED_JOB_IMAGE",
        message: "Use a valid JPEG, PNG, or WebP image whose filename and content agree.",
      });
    let metadata;
    try {
      metadata = await sharp(file.buffer, {
        failOn: "error",
        limitInputPixels: limits.JOBS_MAX_IMAGE_WIDTH * limits.JOBS_MAX_IMAGE_HEIGHT,
      }).metadata();
    } catch {
      throw new BadRequestException({
        code: "CORRUPT_JOB_IMAGE",
        message: "The image could not be decoded safely.",
      });
    }
    const width = metadata.autoOrient?.width ?? metadata.width ?? 0;
    const height = metadata.autoOrient?.height ?? metadata.height ?? 0;
    if (
      width < limits.JOBS_MIN_IMAGE_WIDTH ||
      height < limits.JOBS_MIN_IMAGE_HEIGHT ||
      width > limits.JOBS_MAX_IMAGE_WIDTH ||
      height > limits.JOBS_MAX_IMAGE_HEIGHT
    )
      throw new BadRequestException({
        code: "JOB_IMAGE_DIMENSIONS",
        message: "The image dimensions are outside the supported range.",
      });
    const id = randomUUID();
    const variants: {
      kind: "ORIGINAL" | "LARGE" | "STANDARD" | "THUMBNAIL";
      storageKey: string;
      mimeType: "image/webp";
      sizeBytes: number;
      width: number;
      height: number;
    }[] = [];
    try {
      await this.storage.initialize();
      for (const [kind, filename, targetWidth] of [
        ["ORIGINAL", "original", null],
        ["LARGE", "large", 1800],
        ["STANDARD", "standard", 1000],
        ["THUMBNAIL", "thumbnail", 480],
      ] as const) {
        const pipeline = sharp(file.buffer, {
          failOn: "error",
          limitInputPixels: limits.JOBS_MAX_IMAGE_WIDTH * limits.JOBS_MAX_IMAGE_HEIGHT,
        }).rotate();
        if (targetWidth)
          pipeline.resize({ width: targetWidth, fit: "inside", withoutEnlargement: true });
        const result = await pipeline
          .webp({ quality: limits.JOBS_IMAGE_QUALITY, effort: 4 })
          .toBuffer({ resolveWithObject: true });
        const storageKey = `${id}/${filename}.webp`;
        await this.storage.write(storageKey, result.data);
        variants.push({
          kind,
          storageKey,
          mimeType: "image/webp",
          sizeBytes: result.data.length,
          width: result.info.width,
          height: result.info.height,
        });
      }
    } catch {
      await this.storage.remove(id);
      throw new BadRequestException({
        code: "JOB_IMAGE_PROCESSING_FAILED",
        message: "The image could not be processed.",
      });
    }
    const original = variants[0]!;
    return {
      id,
      storageKey: original.storageKey,
      originalFilename: file.originalname.slice(0, 255),
      mimeType: original.mimeType,
      sizeBytes: original.sizeBytes,
      width: original.width,
      height: original.height,
      checksum: createHash("sha256").update(file.buffer).digest("hex"),
      variants,
    };
  }
}
