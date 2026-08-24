import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { BeforeAfterProjectsService } from "../src/before-after/projects.service";

const beforeId = "00000000-0000-4000-8000-000000000001";
const afterId = "00000000-0000-4000-8000-000000000002";
const actor = (canPublish = true) =>
  ({
    userId: "actor",
    permissions: canPublish ? ["projects.beforeAfter.publish"] : [],
  }) as never;

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
    coverMediaId: null,
    primaryBeforeMedia: media(beforeId, "Clouded exterior glass before cleaning"),
    primaryAfterMedia: media(afterId, "Clear exterior glass after cleaning"),
    coverMedia: null,
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
        intent: "SAVE_DRAFT",
      },
      actor(),
    );
    expect(result.status).toBe("DRAFT");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ createdBy: { connect: { id: "actor" } } }),
      }),
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
          intent: "SAVE_DRAFT",
        },
        actor(),
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

  it.each([
    { label: "both photos", before: null, after: null },
    { label: "the After photo", before: beforeId, after: null },
    { label: "the Before photo", before: null, after: afterId },
  ])("rejects direct publication missing $label", async ({ before, after }) => {
    const selected = [before, after].filter(Boolean) as string[];
    const projects = service(
      {
        client: {
          mediaAsset: {
            findMany: vi.fn().mockResolvedValue(
              selected.map((id) => ({
                id,
                altText: "Meaningful project photo",
                visibility: "PRIVATE",
                primaryBeforeFor: [],
                primaryAfterFor: [],
                coverFor: [],
                projectLinks: [],
              })),
            ),
          },
          beforeAfterProject: { findUnique: vi.fn().mockResolvedValue(null) },
        },
      },
      { moveMedia: vi.fn() },
    );
    await expect(
      projects.create(
        {
          title: "Direct project",
          slug: "direct-project",
          summary: "A complete summary.",
          description: "A complete project description.",
          serviceKey: "window-cleaning",
          serviceAreaKey: "vancouver",
          featured: false,
          primaryBeforeMediaId: before,
          primaryAfterMediaId: after,
          supportingMedia: [],
          intent: "PUBLISH",
        },
        actor(),
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "PUBLISH_VALIDATION_FAILED" }),
    });
  });

  it("publishes a valid new project in one server operation", async () => {
    const created = project({ status: "PUBLISHED", publishedAt: new Date() });
    const create = vi.fn().mockResolvedValue(created);
    const transaction = {
      mediaAsset: { updateMany: vi.fn() },
      beforeAfterProject: { create },
      auditLog: { createMany: vi.fn() },
    };
    const audit = { record: vi.fn() };
    const storage = { moveMedia: vi.fn() };
    const projects = new BeforeAfterProjectsService(
      {
        client: {
          mediaAsset: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: beforeId,
                altText: "Clouded glass before cleaning",
                visibility: "PRIVATE",
                primaryBeforeFor: [],
                primaryAfterFor: [],
                coverFor: [],
                projectLinks: [],
              },
              {
                id: afterId,
                altText: "Clear glass after cleaning",
                visibility: "PRIVATE",
                primaryBeforeFor: [],
                primaryAfterFor: [],
                coverFor: [],
                projectLinks: [],
              },
            ]),
          },
          beforeAfterProject: { findUnique: vi.fn().mockResolvedValue(null) },
          $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
            callback(transaction),
          ),
        },
      } as never,
      storage as never,
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
        featured: true,
        primaryBeforeMediaId: beforeId,
        primaryAfterMediaId: afterId,
        coverMediaId: afterId,
        supportingMedia: [],
        intent: "PUBLISH",
      },
      actor(),
    );
    expect(result.status).toBe("PUBLISHED");
    expect(create).toHaveBeenCalledTimes(1);
    expect(storage.moveMedia).toHaveBeenCalledTimes(2);
    expect(transaction.auditLog.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ action: "before_after_project.created" }),
          expect.objectContaining({ action: "before_after_project.published" }),
        ]),
      }),
    );
  });

  it("does not allow create permission alone to bypass publication permission", async () => {
    const projects = service({ client: {} });
    await expect(
      projects.create(
        {
          title: "Permission check",
          slug: "permission-check",
          summary: "Complete summary",
          description: "Complete description",
          serviceKey: "window-cleaning",
          serviceAreaKey: "vancouver",
          featured: false,
          primaryBeforeMediaId: beforeId,
          primaryAfterMediaId: afterId,
          supportingMedia: [],
          intent: "PUBLISH",
        },
        actor(false),
      ),
    ).rejects.toMatchObject({ response: expect.objectContaining({ code: "PERMISSION_DENIED" }) });
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
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PUBLISHED",
          primaryBeforeMedia: { is: { visibility: "PUBLIC", status: "READY" } },
          primaryAfterMedia: { is: { visibility: "PUBLIC", status: "READY" } },
        }),
      }),
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

  it("ranks bounded Related and More Projects and returns deterministic neighbours", async () => {
    const published = (id: string, overrides: Record<string, unknown> = {}) => {
      const base = project({
        id,
        slug: `project-${id}`,
        status: "PUBLISHED",
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        primaryBeforeMedia: { ...media(`${id}-before`), visibility: "PUBLIC" },
        primaryAfterMedia: { ...media(`${id}-after`), visibility: "PUBLIC" },
        ...overrides,
      });
      return base;
    };
    const current = published("current");
    const sameBoth = published("same-both");
    const sameService = published("same-service", { serviceAreaKey: "burnaby" });
    const sameArea = published("same-area", { serviceKey: "pressure-washing" });
    const fallback = published("fallback", {
      serviceKey: "moss-removal",
      serviceAreaKey: "surrey",
    });
    const more = published("more");
    const previous = published("previous");
    const next = published("next");
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([sameBoth])
      .mockResolvedValueOnce([sameBoth, sameService])
      .mockResolvedValueOnce([sameBoth, sameArea])
      .mockResolvedValueOnce([fallback])
      .mockResolvedValueOnce([more])
      .mockResolvedValueOnce([previous])
      .mockResolvedValueOnce([next]);
    const projects = service({
      client: {
        beforeAfterProject: {
          findFirst: vi.fn().mockResolvedValue(current),
          findMany,
        },
      },
    });

    const context = await projects.publicContext(current.slug);

    expect(context.relatedProjects.map(({ id }) => id)).toEqual([
      "same-both",
      "same-service",
      "same-area",
    ]);
    expect(context.moreProjects.map(({ id }) => id)).toEqual(["more"]);
    expect(context.previousProject?.id).toBe("previous");
    expect(context.nextProject?.id).toBe("next");
    expect(findMany).toHaveBeenCalledTimes(7);
    expect(findMany.mock.calls[4]![0]).toMatchObject({
      take: 3,
      where: {
        status: "PUBLISHED",
        id: { notIn: ["current", "same-both", "same-service", "same-area"] },
      },
    });
    expect(findMany.mock.calls[5]![0]).toMatchObject({ cursor: { id: "current" }, take: -1 });
    expect(findMany.mock.calls[6]![0]).toMatchObject({ cursor: { id: "current" }, take: 1 });
    expect(findMany.mock.calls[5]![0].orderBy).toEqual(findMany.mock.calls[6]![0].orderBy);
    expect(findMany.mock.calls[5]![0].orderBy).toEqual([
      { completedAt: { sort: "desc", nulls: "last" } },
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("does not wrap Previous or Next at portfolio edges", async () => {
    const current = project({
      status: "PUBLISHED",
      publishedAt: new Date("2026-08-01T00:00:00.000Z"),
      primaryBeforeMedia: { ...media("edge-before"), visibility: "PUBLIC" },
      primaryAfterMedia: { ...media("edge-after"), visibility: "PUBLIC" },
    });
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const projects = service({
      client: {
        beforeAfterProject: {
          findFirst: vi.fn().mockResolvedValue(current),
          findMany,
        },
      },
    });

    const context = await projects.publicContext(current.slug);

    expect(context.previousProject).toBeNull();
    expect(context.nextProject).toBeNull();
    expect(findMany.mock.calls[5]![0]).toMatchObject({ skip: 1, take: -1 });
    expect(findMany.mock.calls[6]![0]).toMatchObject({ skip: 1, take: 1 });
  });
});
