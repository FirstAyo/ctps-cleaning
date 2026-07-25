import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImageProcessingService } from "../src/before-after/image-processing.service";
import { LocalMediaStorageService } from "../src/before-after/local-media-storage.service";
import { BeforeAfterMediaService } from "../src/before-after/media.service";

const temporaryRoots: string[] = [];

function config(overrides: Record<string, unknown> = {}) {
  return {
    value: {
      MEDIA_LOCAL_PUBLIC_ROOT: "public",
      MEDIA_LOCAL_PRIVATE_ROOT: "private",
      MEDIA_MAX_FILE_BYTES: 10 * 1024 * 1024,
      MEDIA_MAX_UPLOAD_FILES: 10,
      MEDIA_MAX_TOTAL_UPLOAD_BYTES: 50 * 1024 * 1024,
      MEDIA_MIN_WIDTH: 600,
      MEDIA_MIN_HEIGHT: 400,
      MEDIA_MAX_WIDTH: 12_000,
      MEDIA_MAX_HEIGHT: 12_000,
      MEDIA_IMAGE_QUALITY: 82,
      ...overrides,
    },
  };
}

function uploadFile(buffer: Buffer, name: string, mimetype: string): Express.Multer.File {
  return {
    buffer,
    originalname: name,
    mimetype,
    size: buffer.length,
    fieldname: "files",
    encoding: "7bit",
    destination: "",
    filename: "",
    path: "",
    stream: undefined as never,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("local before-and-after storage", () => {
  it("separates public and private roots and blocks path traversal", async () => {
    const root = await mkdtemp(join(tmpdir(), "ctps-media-"));
    temporaryRoots.push(root);
    await mkdir(join(root, "workspace"));
    const previous = process.cwd();
    process.chdir(join(root, "workspace"));
    try {
      const storage = new LocalMediaStorageService(config() as never);
      const id = "00000000-0000-4000-8000-000000000001";
      await storage.initialize();
      await storage.write("PRIVATE", `${id}/original.webp`, Buffer.from("private"));
      expect(await storage.exists("PRIVATE", `${id}/original.webp`)).toBe(true);
      expect(await storage.exists("PUBLIC", `${id}/original.webp`)).toBe(false);
      await storage.moveMedia(id, "PRIVATE", "PUBLIC");
      expect((await storage.read("PUBLIC", `${id}/original.webp`)).toString()).toBe("private");
      await expect(storage.read("PRIVATE", "../../secret.webp")).rejects.toThrow(
        "Invalid managed media key",
      );
    } finally {
      process.chdir(previous);
    }
  });
});

describe("image processing", () => {
  it("validates signatures and creates stripped WebP variants without upscaling", async () => {
    const input = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#336699" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const written = new Map<string, Buffer>();
    const storage = {
      initialize: vi.fn(),
      write: vi.fn((_visibility: string, key: string, data: Buffer) => {
        written.set(key, data);
      }),
      deleteMedia: vi.fn(),
    };
    const service = new ImageProcessingService(config() as never, storage as never);
    const result = await service.process(uploadFile(input, "result.jpg", "image/jpeg"));

    expect(result.variants.map(({ kind }) => kind)).toEqual([
      "ORIGINAL",
      "LARGE",
      "GALLERY",
      "THUMBNAIL",
    ]);
    expect(result.variants.every(({ mimeType }) => mimeType === "image/webp")).toBe(true);
    expect(Math.max(...result.variants.map(({ width }) => width))).toBeLessThanOrEqual(800);
    const metadata = await sharp(written.get(result.storageKey)!).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });

  it.each([
    [Buffer.from("<svg><script>alert(1)</script></svg>"), "attack.svg", "image/svg+xml"],
    [Buffer.from([0xff, 0xd8, 0xff, 0x00]), "fake.png", "image/png"],
  ])("rejects unsupported or mismatched image content", async (buffer, name, mimetype) => {
    const service = new ImageProcessingService(config() as never, {} as never);
    await expect(service.process(uploadFile(buffer, name, mimetype))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe("managed media service", () => {
  it("enforces aggregate upload limits before image processing", async () => {
    const processor = { process: vi.fn() };
    const service = new BeforeAfterMediaService(
      {} as never,
      processor as never,
      {} as never,
      config({ MEDIA_MAX_TOTAL_UPLOAD_BYTES: 3 }) as never,
      {} as never,
    );
    await expect(
      service.upload([uploadFile(Buffer.from("large"), "large.jpg", "image/jpeg")], "actor"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(processor.process).not.toHaveBeenCalled();
  });

  it("does not serve private media publicly and protects referenced deletion", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        id: "media",
        visibility: "PRIVATE",
        status: "READY",
        variants: [{ storageKey: "key", mimeType: "image/webp", sizeBytes: 1 }],
      })
      .mockResolvedValueOnce({
        id: "media",
        visibility: "PRIVATE",
        primaryBeforeFor: [{ id: "project" }],
        primaryAfterFor: [],
        projectLinks: [],
      });
    const service = new BeforeAfterMediaService(
      { client: { mediaAsset: { findUnique } } } as never,
      {} as never,
      { read: vi.fn() } as never,
      config() as never,
      {} as never,
    );
    await expect(service.file("media", "gallery", true)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove("media", "actor")).rejects.toBeInstanceOf(ConflictException);
  });
});
