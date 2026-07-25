import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { BeforeAfterProjectsService } from "../src/before-after/projects.service";

const beforeId = "00000000-0000-4000-8000-000000000001";
const afterId = "00000000-0000-4000-8000-000000000002";

function media(id: string, altText = "Clean glass after professional service") {
  return {
    id,
    altText,
    caption: null,
    width: 800,
    height: 600,
    visibility: "PRIVATE",
    status: "READY",
    variants: [{ kind: "GALLERY", width: 800, height: 600 }],
  };
}

function project(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-07-24T00:00:00.000Z");
  return {
    id: "00000000-0000-4000-8000-000000000010",
    slug: "window-restoration-vancouver",
    title: "Window restoration",
    summary: "A careful exterior window restoration.",
    description: "The project was assessed, cleaned, and reviewed with the property owner.",
    status: "DRAFT",
    featured: true,
    publishedAt: null,
    completedAt: now,
    serviceKey: "window-cleaning",
    serviceAreaKey: "vancouver",
    seoTitle: null,
    seoDescription: null,
    displayOrder: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    primaryBeforeMediaId: beforeId,
    primaryAfterMediaId: afterId,
    primaryBeforeMedia: media(beforeId, "Clouded exterior glass before cleaning"),
    primaryAfterMedia: media(afterId, "Clear exterior glass after cleaning"),
    supportingMedia: [],
    ...overrides,
  };
}

function service(database: Record<string, unknown>, storage: Record<string, unknown> = {}) {
  return new BeforeAfterProjectsService(
    database as never,
    storage as never,
    { value: { MEDIA_MAX_PROJECT_SUPPORTING_IMAGES: 12 } } as never,
    { record: vi.fn() } as never,
  );
}

describe("before-and-after project lifecycle", () => {
  it("creates a private Draft and records the action", async () => {
    const created = project({ primaryBeforeMedia: null, primaryAfterMedia: null });
    const create = vi.fn().mockResolvedValue(created);
    const audit = { record: vi.fn() };
    const projects = new BeforeAfterProjectsService(
      {
        client: {
          mediaAsset: { findMany: vi.fn().mockResolvedValue([]) },
          beforeAfterProject: { findUnique: vi.fn().mockResolvedValue(null), create },
        },
      } as never,
      {} as never,
      { value: { MEDIA_MAX_PROJECT_SUPPORTING_IMAGES: 12 } } as never,
      audit as never,
    );
    const result = await projects.create(
      {
        title: created.title,
        slug: created.slug,
        summary: created.summary,
        description: created.description,
        serviceKey: "window-cleaning",
        serviceAreaKey: "vancouver",
        completedAt: null,
        seoTitle: null,
        seoDescription: null,
        featured: false,
        primaryBeforeMediaId: null,
        primaryAfterMediaId: null,
        supportingMedia: [],
      },
      "actor",
    );
    expect(result.status).toBe("DRAFT");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdByUserId: "actor" }) }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "before_after_project.created" }),
    );
  });

  it("rejects duplicate slugs and stale concurrent edits", async () => {
    const duplicate = service({
      client: {
        mediaAsset: { findMany: vi.fn().mockResolvedValue([]) },
        beforeAfterProject: { findUnique: vi.fn().mockResolvedValue({ id: "other" }) },
      },
    });
    await expect(
      duplicate.create(
        {
          title: "Project",
          slug: "existing-project",
          summary: "Summary",
          description: "Description",
          serviceKey: "window-cleaning",
          serviceAreaKey: "vancouver",
          completedAt: null,
          seoTitle: null,
          seoDescription: null,
          featured: false,
          primaryBeforeMediaId: null,
          primaryAfterMediaId: null,
          supportingMedia: [],
        },
        "actor",
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    const current = project({
      primaryBeforeMediaId: null,
      primaryAfterMediaId: null,
      primaryBeforeMedia: null,
      primaryAfterMedia: null,
    });
    const transaction = {
      beforeAfterProject: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const stale = service({
      client: {
        beforeAfterProject: { findUnique: vi.fn().mockResolvedValue(current) },
        $transaction: (callback: (tx: typeof transaction) => unknown) => callback(transaction),
      },
    });
    await expect(
      stale.update(current.id, { version: 1, title: "Changed" }, "actor"),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "PROJECT_VERSION_CONFLICT" }),
    });
  });

  it("validates publication requirements before moving any private files", async () => {
    const storage = { moveMedia: vi.fn() };
    const projects = service(
      {
        client: {
          beforeAfterProject: {
            findUnique: vi.fn().mockResolvedValue(project({ primaryAfterMedia: null })),
          },
        },
      },
      storage,
    );
    await expect(projects.publish(project().id, "actor")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.moveMedia).not.toHaveBeenCalled();
  });

  it("publishes ready media, exposes only published records, and unpublishes back to private", async () => {
    const draft = project();
    const published = project({
      status: "PUBLISHED",
      publishedAt: new Date(),
      primaryBeforeMedia: { ...draft.primaryBeforeMedia, visibility: "PUBLIC" },
      primaryAfterMedia: { ...draft.primaryAfterMedia, visibility: "PUBLIC" },
    });
    const findUnique = vi.fn().mockResolvedValueOnce(draft).mockResolvedValueOnce(published);
    const transaction = {
      mediaAsset: { updateMany: vi.fn() },
      beforeAfterProject: {
        update: vi.fn().mockResolvedValueOnce(published).mockResolvedValueOnce(project()),
      },
    };
    const database = {
      client: {
        beforeAfterProject: {
          findUnique,
          findMany: vi.fn().mockResolvedValue([published]),
          count: vi.fn().mockResolvedValue(1),
        },
        $transaction: vi.fn((operation: unknown) =>
          Array.isArray(operation)
            ? Promise.all(operation)
            : (operation as (tx: typeof transaction) => unknown)(transaction),
        ),
      },
    };
    const storage = {
      moveMedia: vi.fn(),
      exists: vi.fn().mockResolvedValue(true),
    };
    const projects = service(database, storage);
    expect((await projects.publish(draft.id, "actor")).status).toBe("PUBLISHED");
    expect(storage.moveMedia).toHaveBeenCalledWith(beforeId, "PRIVATE", "PUBLIC");
    const listing = await projects.publicList({ page: 1, pageSize: 12 });
    expect(listing.items).toHaveLength(1);
    expect(database.client.beforeAfterProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } }),
    );
    expect((await projects.unpublish(draft.id, "actor")).status).toBe("DRAFT");
    expect(storage.moveMedia).toHaveBeenCalledWith(beforeId, "PUBLIC", "PRIVATE");
  });

  it("returns no Draft from a public slug lookup", async () => {
    const projects = service({
      client: { beforeAfterProject: { findFirst: vi.fn().mockResolvedValue(null) } },
    });
    await expect(projects.publicGet("private-draft")).rejects.toBeInstanceOf(NotFoundException);
  });
});
