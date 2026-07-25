import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import sharp from "sharp";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../auth/audit.service";
import { QuoteConfigService } from "./quote-config.service";
import { QuoteSecurityService } from "./quote-security.service";

function imageType(data: Buffer) {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    return { extension: "jpg", mime: "image/jpeg" };
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { extension: "png", mime: "image/png" };
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  )
    return { extension: "webp", mime: "image/webp" };
  return null;
}

@Injectable()
export class QuoteMediaService {
  private readonly root: string;
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(QuoteConfigService) private readonly config: QuoteConfigService,
    @Inject(QuoteSecurityService) private readonly security: QuoteSecurityService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {
    this.root = resolve(process.cwd(), config.value.QUOTE_PRIVATE_MEDIA_ROOT);
  }
  private path(key: string) {
    if (!/^[0-9a-f-]{36}\/preview\.webp$/.test(key)) throw new Error("Invalid quote-media key");
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`))
      throw new Error("Quote-media path escaped its private root");
    return target;
  }
  private async draft(token: string) {
    const draft = await this.database.client.quoteRequestDraft.findUnique({
      where: { tokenHash: this.security.hash(token) },
    });
    if (!draft || draft.expiresAt < new Date() || draft.submittedAt)
      throw new ForbiddenException({
        code: "INVALID_DRAFT",
        message: "The upload session is invalid or expired.",
      });
    return draft;
  }
  async upload(token: string, files: Express.Multer.File[]) {
    const draft = await this.draft(token);
    if (!files.length)
      throw new BadRequestException({
        code: "FILES_REQUIRED",
        message: "Choose at least one image.",
      });
    const existing = await this.database.client.quoteRequestUpload.findMany({
      where: { draftId: draft.id, status: "READY" },
    });
    if (existing.length + files.length > this.config.value.QUOTE_MAX_UPLOAD_FILES)
      throw new BadRequestException({
        code: "TOO_MANY_FILES",
        message: `Up to ${this.config.value.QUOTE_MAX_UPLOAD_FILES} images may be attached.`,
      });
    if (
      existing.reduce((sum, item) => sum + item.sizeBytes, 0) +
        files.reduce((sum, file) => sum + file.size, 0) >
      this.config.value.QUOTE_MAX_TOTAL_UPLOAD_BYTES
    )
      throw new BadRequestException({
        code: "UPLOAD_TOO_LARGE",
        message: "The total image size exceeds the upload limit.",
      });
    const output = [];
    for (const [offset, file] of files.entries()) {
      if (!file.buffer?.length || file.size > this.config.value.QUOTE_MAX_FILE_BYTES)
        throw new BadRequestException({
          code: "INVALID_FILE_SIZE",
          message: `${file.originalname}: invalid file size.`,
        });
      const detected = imageType(file.buffer);
      const extension = file.originalname.split(".").pop()?.toLowerCase().replace("jpeg", "jpg");
      if (!detected || detected.mime !== file.mimetype || detected.extension !== extension)
        throw new BadRequestException({
          code: "INVALID_IMAGE",
          message: `${file.originalname}: use a genuine JPEG, PNG, or WebP image.`,
        });
      let processed: { data: Buffer; width: number; height: number };
      try {
        const result = await sharp(file.buffer, { failOn: "error", limitInputPixels: 100_000_000 })
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });
        if (result.info.width < 200 || result.info.height < 200) throw new Error();
        processed = { data: result.data, width: result.info.width, height: result.info.height };
      } catch {
        throw new BadRequestException({
          code: "UNSAFE_IMAGE",
          message: `${file.originalname}: the image is corrupt or cannot be processed.`,
        });
      }
      const id = randomUUID();
      const storageKey = `${id}/preview.webp`;
      const target = this.path(storageKey);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, processed.data, { flag: "wx" });
      try {
        const record = await this.database.client.quoteRequestUpload.create({
          data: {
            id,
            draftId: draft.id,
            storageKey,
            originalFilename: file.originalname.slice(0, 255),
            mimeType: "image/webp",
            sizeBytes: processed.data.length,
            width: processed.width,
            height: processed.height,
            checksum: createHash("sha256").update(file.buffer).digest("hex"),
            sortOrder: existing.length + offset,
          },
        });
        output.push({
          id: record.id,
          filename: record.originalFilename,
          width: record.width,
          height: record.height,
          sortOrder: record.sortOrder,
        });
      } catch (error) {
        await rm(resolve(this.root, id), { recursive: true, force: true });
        throw error;
      }
    }
    return { uploads: output };
  }
  async remove(token: string, id: string) {
    const draft = await this.draft(token);
    const upload = await this.database.client.quoteRequestUpload.findFirst({
      where: { id, draftId: draft.id, status: "READY" },
    });
    if (!upload)
      throw new NotFoundException({ code: "UPLOAD_NOT_FOUND", message: "Upload not found." });
    await this.database.client.quoteRequestUpload.update({
      where: { id },
      data: { status: "REMOVED", removedAt: new Date() },
    });
    await rm(resolve(this.root, id), { recursive: true, force: true });
    return { success: true };
  }
  async reorder(token: string, ids: string[]) {
    const draft = await this.draft(token);
    const uploads = await this.database.client.quoteRequestUpload.findMany({
      where: { draftId: draft.id, status: "READY" },
      select: { id: true },
    });
    if (
      uploads.length !== ids.length ||
      uploads.some(({ id }) => !ids.includes(id)) ||
      new Set(ids).size !== ids.length
    )
      throw new BadRequestException({
        code: "INVALID_UPLOAD_ORDER",
        message: "Upload order does not match this draft.",
      });
    await this.database.client.$transaction(
      ids.map((id, sortOrder) =>
        this.database.client.quoteRequestUpload.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    return { success: true };
  }
  async fileForAdmin(quoteRequestId: string, id: string, actorUserId: string) {
    const upload = await this.database.client.quoteRequestUpload.findFirst({
      where: { id, quoteRequestId, status: "READY" },
    });
    if (!upload)
      throw new NotFoundException({
        code: "UPLOAD_NOT_FOUND",
        message: "Private image not found.",
      });
    const file = {
      data: await readFile(this.path(upload.storageKey)),
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      filename: upload.originalFilename,
    };
    await this.audit.record({
      actorUserId,
      action: "quote-request.private-media-read",
      resourceType: "quote-request",
      resourceId: quoteRequestId,
      metadata: { uploadId: id },
    });
    return file;
  }
  async deleteExpiredDrafts() {
    const drafts = await this.database.client.quoteRequestDraft.findMany({
      where: { expiresAt: { lt: new Date() }, submittedAt: null },
      include: { uploads: { select: { id: true } } },
    });
    for (const draft of drafts) {
      for (const upload of draft.uploads)
        await rm(resolve(this.root, upload.id), { recursive: true, force: true });
      await this.database.client.quoteRequestDraft.deleteMany({
        where: { id: draft.id, submittedAt: null, expiresAt: { lt: new Date() } },
      });
    }
    return drafts.length;
  }
  async deleteFiles(ids: readonly string[]) {
    for (const id of ids) {
      if (/^[0-9a-f-]{36}$/i.test(id))
        await rm(resolve(this.root, id), { recursive: true, force: true });
    }
  }
}
