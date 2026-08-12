import { BadRequestException, ConflictException } from "@nestjs/common";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketingMediaService } from "../src/marketing/marketing-media.service";

const identity = { userId: crypto.randomUUID() } as never;

function file(name: string, mimetype: string, buffer: Buffer, size = buffer.length) {
  return { originalname: name, mimetype, buffer, size } as Express.Multer.File;
}

interface VariantCreateData {
  kind: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}
interface AssetCreateInput {
  data: {
    id: string;
    variants: { create: VariantCreateData[] };
    [key: string]: unknown;
  };
}

async function raster(
  format: "jpeg" | "png" | "webp",
  width = 1200,
  height = 800,
  orientation?: number,
) {
  let image = sharp({
    create: { width, height, channels: 3, background: { r: 65, g: 108, b: 122 } },
  });
  if (orientation) image = image.withMetadata({ orientation });
  return image[format]({ quality: 94 }).toBuffer();
}

function databaseMock() {
  const assets = new Map<string, Record<string, unknown>>();
  const create = vi.fn(async ({ data }: AssetCreateInput) => {
    const variants = data.variants.create;
    const asset = {
      ...data,
      variants,
      status: "READY",
      caption: null,
      focalPointX: 50,
      focalPointY: 50,
      createdAt: new Date("2026-08-12T12:00:00Z"),
      updatedAt: new Date("2026-08-12T12:00:00Z"),
      archivedAt: null,
      _count: { pageReferences: 0, socialImageFor: 0 },
    };
    assets.set(String(data.id), asset);
    return asset;
  });
  return {
    assets,
    client: {
      publicMediaAsset: {
        create,
        findMany: vi.fn(async () => [...assets.values()]),
        count: vi.fn(async () => assets.size),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => assets.get(where.id)),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
}

describe("public marketing media pipeline", () => {
  let root: string;
  let database: ReturnType<typeof databaseMock>;
  let audit: { record: ReturnType<typeof vi.fn> };
  let service: MarketingMediaService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "ctps-marketing-media-"));
    process.env.ADMIN_URL = "http://localhost:3001";
    process.env.WEB_URL = "http://localhost:3000";
    process.env.DATABASE_URL = "postgresql://ctps:test@localhost:55432/ctps";
    process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001";
    process.env.MARKETING_MEDIA_PUBLIC_ROOT = root;
    database = databaseMock();
    audit = { record: vi.fn(async () => undefined) };
    service = new MarketingMediaService(database as never, audit as never);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
    vi.restoreAllMocks();
  });

  it("accepts valid JPEG, PNG, and WebP and generates every optimized variant", async () => {
    const result = await service.upload(
      [
        file("front.jpg", "image/jpeg", await raster("jpeg")),
        file("deck.png", "image/png", await raster("png")),
        file("windows.webp", "image/webp", await raster("webp")),
      ],
      identity,
    );

    expect(result.failures).toEqual([]);
    expect(result.items).toHaveLength(3);
    for (const item of result.items) {
      expect(Object.keys(item.variants)).toEqual([
        "original",
        "hero",
        "large",
        "standard",
        "card",
        "thumbnail",
      ]);
      expect(Object.values(item.variants).every(({ mimeType }) => mimeType === "image/webp")).toBe(
        true,
      );
    }
  }, 20_000);

  it("resizes a large image, uses purpose-specific dimensions, and does not upscale", async () => {
    const large = await service.upload(
      [file("large.jpg", "image/jpeg", await raster("jpeg", 4000, 2400))],
      identity,
    );
    expect(large.items[0]?.variants).toMatchObject({
      original: { width: 3200, height: 1920 },
      hero: { width: 2400, height: 1440 },
      large: { width: 1800, height: 1080 },
      standard: { width: 1200, height: 720 },
      card: { width: 800, height: 480 },
      thumbnail: { width: 360, height: 216 },
    });

    const small = await service.upload(
      [file("small.jpg", "image/jpeg", await raster("jpeg", 800, 600))],
      identity,
    );
    expect(small.items[0]?.variants.original).toMatchObject({ width: 800, height: 600 });
    expect(small.items[0]?.variants.hero).toMatchObject({ width: 800, height: 600 });
  }, 20_000);

  it("normalizes EXIF orientation and strips EXIF metadata from stored output", async () => {
    const result = await service.upload(
      [file("oriented.jpg", "image/jpeg", await raster("jpeg", 800, 1200, 6))],
      identity,
    );
    const item = result.items[0]!;
    expect(item.variants.original).toMatchObject({ width: 1200, height: 800 });
    const created = database.client.publicMediaAsset.create.mock.calls[0]![0] as AssetCreateInput;
    const originalKey = created.data.variants.create[0]!.storageKey;
    const metadata = await sharp(await readFile(join(root, originalKey))).metadata();
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
  }, 20_000);

  it.each([
    ["vector.svg", "image/svg+xml", Buffer.from("<svg><script>alert(1)</script></svg>")],
    ["renamed.jpg", "image/jpeg", Buffer.from("<html>not an image</html>")],
    ["double.jpg.exe", "application/octet-stream", Buffer.from([0xff, 0xd8, 0xff, 0x00])],
    ["empty.jpg", "image/jpeg", Buffer.alloc(0)],
  ])("rejects unsafe input %s without creating an asset", async (name, type, buffer) => {
    const result = await service.upload([file(name, type, buffer)], identity);
    expect(result.items).toEqual([]);
    expect(result.failures).toHaveLength(1);
    expect(database.client.publicMediaAsset.create).not.toHaveBeenCalled();
  });

  it("rejects extension, MIME, and signature disagreement", async () => {
    const jpeg = await raster("jpeg");
    const result = await service.upload([file("fake.png", "image/png", jpeg)], identity);
    expect(result.items).toEqual([]);
    expect(result.failures[0]?.message).toMatch(/JPEG, PNG, or WebP/);
  });

  it("rejects oversized files and excessive dimensions", async () => {
    const jpeg = await raster("jpeg");
    const oversized = await service.upload(
      [file("oversized.jpg", "image/jpeg", jpeg, 10 * 1024 * 1024 + 1)],
      identity,
    );
    expect(oversized.items).toEqual([]);
    const tooWide = await raster("jpeg", 12_001, 400);
    const dimensions = await service.upload([file("wide.jpg", "image/jpeg", tooWide)], identity);
    expect(dimensions.items).toEqual([]);
    expect(dimensions.failures[0]?.message).toMatch(/dimensions/);
  });

  it("keeps successful files when another item in the batch fails", async () => {
    const result = await service.upload(
      [
        file("good.jpg", "image/jpeg", await raster("jpeg")),
        file("bad.jpg", "image/jpeg", Buffer.from("bad")),
      ],
      identity,
    );
    expect(result.items).toHaveLength(1);
    expect(result.failures).toEqual([
      expect.objectContaining({ filename: "bad.jpg", message: expect.any(String) }),
    ]);
  });

  it("cleans generated files when database creation fails", async () => {
    database.client.publicMediaAsset.create.mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    const result = await service.upload(
      [file("cleanup.jpg", "image/jpeg", await raster("jpeg"))],
      identity,
    );
    expect(result.items).toEqual([]);
    expect(await readdir(root)).toEqual([]);
  });

  it("sanitizes path-traversal filenames and never uses them as storage paths", async () => {
    await mkdir(root, { recursive: true });
    const result = await service.upload(
      [file("../../private/unsafe name.jpg", "image/jpeg", await raster("jpeg"))],
      identity,
    );
    expect(result.items[0]?.originalFilename).toBe("unsafe name.jpg");
    const created = database.client.publicMediaAsset.create.mock.calls[0]![0] as AssetCreateInput;
    expect(created.data.variants.create[0]!.storageKey).toMatch(/^[0-9a-f-]{36}\/original\.webp$/);
  });

  it("rejects a combined request above the configured total limit", async () => {
    const jpeg = await raster("jpeg");
    await expect(
      service.upload(
        Array.from({ length: 6 }, (_, index) =>
          file(`large-${index}.jpg`, "image/jpeg", jpeg, 9 * 1024 * 1024),
        ),
        identity,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("public marketing media library behavior", () => {
  beforeEach(() => {
    process.env.ADMIN_URL = "http://localhost:3001";
    process.env.WEB_URL = "http://localhost:3000";
    process.env.DATABASE_URL = "postgresql://ctps:test@localhost:55432/ctps";
    process.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001";
    process.env.MARKETING_MEDIA_PUBLIC_ROOT = join(tmpdir(), "ctps-marketing-media-library");
  });

  it("applies parameterized search, pagination, status, and useful filters", async () => {
    const findMany = vi.fn(async () => []);
    const count = vi.fn(async () => 0);
    const service = new MarketingMediaService(
      { client: { publicMediaAsset: { findMany, count } } } as never,
      { record: vi.fn() } as never,
    );
    await service.list({
      page: 2,
      pageSize: 24,
      search: "windows",
      filter: "UNUSED",
      status: "READY",
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 24,
        take: 24,
        where: expect.objectContaining({
          status: "READY",
          OR: expect.arrayContaining([expect.objectContaining({ title: expect.any(Object) })]),
          AND: expect.any(Array),
        }),
      }),
    );
    expect(count).toHaveBeenCalled();
  });

  it("filters orientation inside a bounded candidate window", async () => {
    const now = new Date();
    const landscape = {
      id: "a",
      width: 1200,
      height: 800,
      variants: [],
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      originalFilename: "a.jpg",
      title: "A",
      altText: "",
      caption: null,
      mimeType: "image/webp",
      sizeBytes: 1,
      focalPointX: 50,
      focalPointY: 50,
      status: "READY",
      _count: { pageReferences: 0, socialImageFor: 0 },
    };
    const portrait = { ...landscape, id: "b", width: 800, height: 1200 };
    const findMany = vi.fn(async () => [landscape, portrait]);
    const service = new MarketingMediaService(
      { client: { publicMediaAsset: { findMany, count: vi.fn() } } } as never,
      { record: vi.fn() } as never,
    );
    const result = await service.list({
      page: 1,
      pageSize: 24,
      search: "",
      filter: "LANDSCAPE",
      status: "READY",
    });
    expect(result.items.map(({ id }) => id)).toEqual(["a"]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 480 }));
  });

  it("returns safe usage references and blocks deletion while an asset is used", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        id: "asset",
        pageReferences: [
          {
            usage: "PUBLISHED:HERO_SLIDER:0:media:1",
            sortOrder: 1,
            page: { pageKey: "HOME", title: "Homepage", slug: "/" },
          },
        ],
        socialImageFor: [],
      })
      .mockResolvedValueOnce({ id: "asset", _count: { pageReferences: 2, socialImageFor: 1 } });
    const remove = vi.fn();
    const service = new MarketingMediaService(
      { client: { publicMediaAsset: { findUnique, delete: remove } } } as never,
      { record: vi.fn() } as never,
    );
    await expect(service.usage("asset")).resolves.toEqual({
      items: [
        expect.objectContaining({
          pageTitle: "Homepage",
          usage: "PUBLISHED:HERO_SLIDER:0:media:1",
        }),
      ],
    });
    await expect(service.remove("asset", identity)).rejects.toBeInstanceOf(ConflictException);
    expect(remove).not.toHaveBeenCalled();
  });

  it("archives, restores, and audits lifecycle changes", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const detail = vi.fn().mockResolvedValue({ id: "asset" });
    const audit = { record: vi.fn(async () => undefined) };
    const service = new MarketingMediaService(
      { client: { publicMediaAsset: { updateMany } } } as never,
      audit as never,
    );
    vi.spyOn(service, "detail").mockImplementation(detail);
    await service.archive("asset", identity);
    await service.restore("asset", identity);
    expect(updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: "asset", status: "READY" } }),
    );
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: "asset", status: "ARCHIVED" } }),
    );
    expect(audit.record).toHaveBeenCalledTimes(2);
  });
});
