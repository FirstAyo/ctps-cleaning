import { BadRequestException, Injectable, Inject } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";

import { LocalMediaStorageService } from "./local-media-storage.service";
import { MediaConfigService } from "./media-config.service";

const accepted = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);
function signature(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length >= 12 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
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

export interface ProcessedUpload {
  readonly id: string;
  readonly storageKey: string;
  readonly storedFilename: string;
  readonly mimeType: "image/webp";
  readonly sizeBytes: number;
  readonly width: number;
  readonly height: number;
  readonly checksum: string;
  readonly originalFilename: string;
  readonly variants: readonly {
    readonly kind: "ORIGINAL" | "LARGE" | "GALLERY" | "THUMBNAIL";
    readonly storageKey: string;
    readonly mimeType: "image/webp";
    readonly sizeBytes: number;
    readonly width: number;
    readonly height: number;
  }[];
}

@Injectable()
export class ImageProcessingService {
  constructor(
    @Inject(MediaConfigService) private readonly config: MediaConfigService,
    @Inject(LocalMediaStorageService) private readonly storage: LocalMediaStorageService,
  ) {}
  async process(file: Express.Multer.File): Promise<ProcessedUpload> {
    const limits = this.config.value;
    if (!file.buffer?.length)
      throw new BadRequestException({
        code: "EMPTY_FILE",
        message: `${file.originalname}: the image is empty.`,
      });
    if (file.size > limits.MEDIA_MAX_FILE_BYTES)
      throw new BadRequestException({
        code: "FILE_TOO_LARGE",
        message: `${file.originalname}: the image exceeds the file-size limit.`,
      });
    const detected = signature(file.buffer);
    const expected = detected ? accepted.get(detected) : undefined;
    const extension =
      file.originalname.split(".").pop()?.toLowerCase() === "jpeg"
        ? "jpg"
        : file.originalname.split(".").pop()?.toLowerCase();
    if (!detected || !expected || file.mimetype !== expected || extension !== detected)
      throw new BadRequestException({
        code: "UNSUPPORTED_OR_MISMATCHED_IMAGE",
        message: `${file.originalname}: use a valid JPEG, PNG, or WebP image whose content matches its type.`,
      });
    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer, {
        failOn: "error",
        limitInputPixels: limits.MEDIA_MAX_WIDTH * limits.MEDIA_MAX_HEIGHT,
      }).metadata();
    } catch {
      throw new BadRequestException({
        code: "CORRUPT_IMAGE",
        message: `${file.originalname}: the image is corrupt or unsafe to process.`,
      });
    }
    if (!metadata.width || !metadata.height)
      throw new BadRequestException({
        code: "INVALID_DIMENSIONS",
        message: `${file.originalname}: image dimensions could not be read.`,
      });
    const orientedWidth = metadata.autoOrient?.width ?? metadata.width;
    const orientedHeight = metadata.autoOrient?.height ?? metadata.height;
    if (orientedWidth < limits.MEDIA_MIN_WIDTH || orientedHeight < limits.MEDIA_MIN_HEIGHT)
      throw new BadRequestException({
        code: "IMAGE_TOO_SMALL",
        message: `${file.originalname}: minimum dimensions are ${limits.MEDIA_MIN_WIDTH} × ${limits.MEDIA_MIN_HEIGHT}.`,
      });
    if (orientedWidth > limits.MEDIA_MAX_WIDTH || orientedHeight > limits.MEDIA_MAX_HEIGHT)
      throw new BadRequestException({
        code: "IMAGE_TOO_LARGE",
        message: `${file.originalname}: maximum dimensions are ${limits.MEDIA_MAX_WIDTH} × ${limits.MEDIA_MAX_HEIGHT}.`,
      });
    const id = randomUUID();
    const specifications = [
      ["ORIGINAL", null],
      ["LARGE", 1800],
      ["GALLERY", 1100],
      ["THUMBNAIL", 480],
    ] as const;
    const variants: ProcessedUpload["variants"][number][] = [];
    try {
      await this.storage.initialize();
      for (const [kind, width] of specifications) {
        const pipeline = sharp(file.buffer, {
          failOn: "error",
          limitInputPixels: limits.MEDIA_MAX_WIDTH * limits.MEDIA_MAX_HEIGHT,
        }).rotate();
        if (width)
          pipeline.resize({
            width,
            height: Math.round(width * 0.75),
            fit: "inside",
            withoutEnlargement: true,
          });
        const { data, info } = await pipeline
          .webp({ quality: limits.MEDIA_IMAGE_QUALITY, effort: 4 })
          .toBuffer({ resolveWithObject: true });
        const storageKey = `${id}/${kind.toLowerCase()}.webp`;
        await this.storage.write("PRIVATE", storageKey, data);
        variants.push({
          kind,
          storageKey,
          mimeType: "image/webp",
          sizeBytes: data.length,
          width: info.width,
          height: info.height,
        });
      }
    } catch (error) {
      await this.storage.deleteMedia("PRIVATE", id);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        code: "IMAGE_PROCESSING_FAILED",
        message: `${file.originalname}: the image could not be processed.`,
      });
    }
    const original = variants[0]!;
    return {
      id,
      storageKey: original.storageKey,
      storedFilename: `${id}.webp`,
      mimeType: "image/webp",
      sizeBytes: original.sizeBytes,
      width: original.width,
      height: original.height,
      checksum: createHash("sha256").update(file.buffer).digest("hex"),
      originalFilename: file.originalname.slice(0, 255),
      variants,
    };
  }
}
