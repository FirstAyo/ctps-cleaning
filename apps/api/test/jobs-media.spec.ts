import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { JobImageService } from "../src/jobs/job-image.service";
import { JobStorageService } from "../src/jobs/job-storage.service";

const limits = {
  JOBS_MAX_FILE_BYTES: 10_000_000,
  JOBS_MIN_IMAGE_WIDTH: 600,
  JOBS_MIN_IMAGE_HEIGHT: 400,
  JOBS_MAX_IMAGE_WIDTH: 12_000,
  JOBS_MAX_IMAGE_HEIGHT: 12_000,
  JOBS_IMAGE_QUALITY: 82,
};
describe("private job media security", () => {
  it.each([
    ["vector.svg", "image/svg+xml", "<svg/>"],
    ["animation.gif", "image/gif", "GIF89a"],
    ["document.pdf", "application/pdf", "%PDF"],
  ])("rejects unsupported input %s", async (name, mimetype, body) => {
    const storage = { initialize: vi.fn(), write: vi.fn(), remove: vi.fn() };
    const service = new JobImageService({ value: limits } as never, storage as never);
    const buffer = Buffer.from(body);
    await expect(
      service.process({
        originalname: name,
        mimetype,
        buffer,
        size: buffer.length,
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it("blocks path traversal", () => {
    const storage = new JobStorageService({
      value: { JOBS_PRIVATE_MEDIA_ROOT: "storage/private/jobs" },
    } as never);
    expect(() => storage.read("../../secret.txt")).toThrow("Invalid managed job-media key");
  });
});
