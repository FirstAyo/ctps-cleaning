import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";

import { BlogConfigService } from "./blog-config.service";
import { BlogStorageService } from "./blog-storage.service";

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

export interface ProcessedBlogImage {
  id: string;
  storageKey: string;
  originalFilename: string;
  mimeType: "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
  checksum: string;
  variants: {
    kind: "ORIGINAL" | "FEATURED" | "ARTICLE_LARGE" | "ARTICLE_STANDARD" | "THUMBNAIL";
    storageKey: string;
    mimeType: "image/webp";
    sizeBytes: number;
    width: number;
    height: number;
  }[];
}

@Injectable()
export class BlogImageService {
  constructor(
    @Inject(BlogConfigService) private readonly config: BlogConfigService,
    @Inject(BlogStorageService) private readonly storage: BlogStorageService,
  ) {}

  async process(file: Express.Multer.File): Promise<ProcessedBlogImage> {
    const limits = this.config.value;
    if (!file.buffer?.length || file.size > limits.BLOG_MAX_FILE_BYTES)
      throw new BadRequestException({
        code: "INVALID_BLOG_IMAGE",
        message: "The image is empty or too large.",
      });
    const detected = signature(file.buffer);
    const extension =
      file.originalname.split(".").pop()?.toLowerCase() === "jpeg"
        ? "jpg"
        : file.originalname.split(".").pop()?.toLowerCase();
    if (!detected || extension !== detected || file.mimetype !== mimeByExtension.get(detected))
      throw new BadRequestException({
        code: "UNSUPPORTED_BLOG_IMAGE",
        message: "Use a valid JPEG, PNG, or WebP image whose filename and content agree.",
      });
    let width: number;
    let height: number;
    try {
      const metadata = await sharp(file.buffer, {
        failOn: "error",
        limitInputPixels: limits.BLOG_MAX_IMAGE_WIDTH * limits.BLOG_MAX_IMAGE_HEIGHT,
      }).metadata();
      width = metadata.autoOrient?.width ?? metadata.width ?? 0;
      height = metadata.autoOrient?.height ?? metadata.height ?? 0;
    } catch {
      throw new BadRequestException({
        code: "CORRUPT_BLOG_IMAGE",
        message: "The image could not be decoded safely.",
      });
    }
    if (
      width < limits.BLOG_MIN_IMAGE_WIDTH ||
      height < limits.BLOG_MIN_IMAGE_HEIGHT ||
      width > limits.BLOG_MAX_IMAGE_WIDTH ||
      height > limits.BLOG_MAX_IMAGE_HEIGHT
    )
      throw new BadRequestException({
        code: "BLOG_IMAGE_DIMENSIONS",
        message: "The image dimensions are outside the supported range.",
      });
    const id = randomUUID();
    const variants: ProcessedBlogImage["variants"] = [];
    const specifications = [
      ["ORIGINAL", "original", null],
      ["FEATURED", "featured", 1800],
      ["ARTICLE_LARGE", "article-large", 1600],
      ["ARTICLE_STANDARD", "article-standard", 1000],
      ["THUMBNAIL", "thumbnail", 480],
    ] as const;
    try {
      await this.storage.initialize();
      for (const [kind, filename, targetWidth] of specifications) {
        const pipeline = sharp(file.buffer, {
          failOn: "error",
          limitInputPixels: limits.BLOG_MAX_IMAGE_WIDTH * limits.BLOG_MAX_IMAGE_HEIGHT,
        }).rotate();
        if (targetWidth)
          pipeline.resize({ width: targetWidth, fit: "inside", withoutEnlargement: true });
        const result = await pipeline
          .webp({ quality: limits.BLOG_IMAGE_QUALITY, effort: 4 })
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
      await this.storage.remove(id, "PRIVATE");
      throw new BadRequestException({
        code: "BLOG_IMAGE_PROCESSING_FAILED",
        message: "The image could not be processed.",
      });
    }
    const original = variants[0]!;
    return {
      id,
      storageKey: original.storageKey,
      originalFilename: file.originalname.slice(0, 255),
      mimeType: "image/webp",
      sizeBytes: original.sizeBytes,
      width: original.width,
      height: original.height,
      checksum: createHash("sha256").update(file.buffer).digest("hex"),
      variants,
    };
  }
}
