import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { BlogImageService } from "../src/blog/blog-image.service";
import { BlogStorageService } from "../src/blog/blog-storage.service";

const limits = {
  BLOG_MAX_FILE_BYTES: 10_000_000,
  BLOG_MIN_IMAGE_WIDTH: 640,
  BLOG_MIN_IMAGE_HEIGHT: 360,
  BLOG_MAX_IMAGE_WIDTH: 8000,
  BLOG_MAX_IMAGE_HEIGHT: 8000,
  BLOG_IMAGE_QUALITY: 82,
};
function file(name: string, type: string, body: string): Express.Multer.File {
  const buffer = Buffer.from(body);
  return { originalname: name, mimetype: type, buffer, size: buffer.length } as Express.Multer.File;
}

describe("blog media security", () => {
  it.each([
    ["vector.svg", "image/svg+xml", "<svg><script>alert(1)</script></svg>"],
    ["animation.gif", "image/gif", "GIF89a"],
    ["document.pdf", "application/pdf", "%PDF"],
  ])("rejects unsupported active or non-image input %s", async (name, type, body) => {
    const storage = { initialize: vi.fn(), write: vi.fn(), remove: vi.fn() };
    const images = new BlogImageService({ value: limits } as never, storage as never);
    await expect(images.process(file(name, type, body))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.write).not.toHaveBeenCalled();
  });
  it("rejects extension, MIME, and actual-signature disagreement", async () => {
    const storage = { initialize: vi.fn(), write: vi.fn(), remove: vi.fn() };
    const images = new BlogImageService({ value: limits } as never, storage as never);
    const jpegSignature = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    await expect(
      images.process({
        originalname: "fake.png",
        mimetype: "image/png",
        buffer: jpegSignature,
        size: jpegSignature.length,
      } as Express.Multer.File),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "UNSUPPORTED_BLOG_IMAGE" }),
    });
  });
  it("does not permit a storage key to traverse either managed root", () => {
    const storage = new BlogStorageService({
      value: {
        BLOG_LOCAL_PRIVATE_ROOT: "storage/private/blog",
        BLOG_LOCAL_PUBLIC_ROOT: "storage/public/blog",
      },
    } as never);
    expect(() => storage.read("PRIVATE", "../../secrets.txt")).toThrow(
      "Invalid managed blog-media key",
    );
  });
});
