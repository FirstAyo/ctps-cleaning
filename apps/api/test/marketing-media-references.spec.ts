import { describe, expect, it, vi } from "vitest";

import { MarketingService } from "../src/marketing/marketing.service";

const mediaId = crypto.randomUUID();
const actorUserId = crypto.randomUUID();
const content = {
  sections: [
    {
      id: "hero",
      type: "HERO_SLIDER",
      enabled: true,
      eyebrow: "Property care",
      title: "A considered approach",
      body: "Clear property-care context.",
      primaryCta: { label: "Request a Quote", href: "/request-a-quote" },
      mediaIds: [mediaId],
      overlay: "BALANCED",
      autoplay: true,
      intervalMs: 7000,
    },
  ],
};

describe("marketing page media reference lifecycle", () => {
  it("rejects a Draft project identifier at the trusted page-save boundary", async () => {
    const service = new MarketingService(
      {
        client: {
          publicMediaAsset: { count: vi.fn(async () => 0) },
          beforeAfterProject: { count: vi.fn(async () => 0) },
          blogPost: { count: vi.fn(async () => 0) },
        },
      } as never,
      { record: vi.fn(async () => undefined) } as never,
    );
    await expect(
      service.update(
        "SERVICES",
        {
          version: 1,
          title: "Services",
          draftContent: {
            sections: [
              {
                id: "proof",
                type: "FEATURED_PROJECT",
                enabled: true,
                title: "Selected work",
                items: [],
                mediaIds: [],
                projectIds: [crypto.randomUUID()],
                postIds: [],
              },
            ],
          },
        } as never,
        actorUserId,
        false,
      ),
    ).rejects.toMatchObject({ response: { code: "PROJECT_NOT_AVAILABLE" } });
  });

  it("replaces Draft references only and audits a changed selection", async () => {
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const createMany = vi.fn(async () => ({ count: 1 }));
    const transaction = {
      marketingPage: {
        findUnique: vi.fn(async () => ({ id: "page", version: 1, mediaReferences: [] })),
        updateMany: vi.fn(async () => ({ count: 1 })),
        findUniqueOrThrow: vi.fn(async () => ({ id: "page", version: 2 })),
      },
      marketingPageMedia: { deleteMany, createMany },
      marketingPageRevision: { create: vi.fn(async () => ({ id: "revision" })) },
    };
    const audit = { record: vi.fn(async () => undefined) };
    const service = new MarketingService(
      {
        client: {
          publicMediaAsset: { count: vi.fn(async () => 1) },
          $transaction: vi.fn(async (callback: (value: typeof transaction) => unknown) =>
            callback(transaction),
          ),
        },
      } as never,
      audit as never,
    );

    await service.update(
      "HOME",
      { version: 1, title: "Homepage", draftContent: content } as never,
      actorUserId,
      false,
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: { pageId: "page", usage: { startsWith: "DRAFT:" } },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          mediaId,
          usage: "DRAFT:HERO_SLIDER:0:media:0",
        }),
      ],
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "marketing_page.media_selection_changed" }),
    );
  });

  it("publishes independent Published references without removing Draft references", async () => {
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const createMany = vi.fn(async () => ({ count: 1 }));
    const transaction = {
      marketingPage: {
        findUnique: vi.fn(async () => ({
          id: "page",
          version: 2,
          draftContent: content,
          seoTitle: null,
          seoDescription: null,
          ogTitle: null,
          ogDescription: null,
          socialImageId: null,
        })),
        update: vi.fn(async () => ({ id: "page", version: 3 })),
      },
      marketingPageMedia: { deleteMany, createMany },
      marketingPageRevision: { create: vi.fn(async () => ({ id: "revision" })) },
    };
    const service = new MarketingService(
      {
        client: {
          $transaction: vi.fn(async (callback: (value: typeof transaction) => unknown) =>
            callback(transaction),
          ),
        },
      } as never,
      { record: vi.fn(async () => undefined) } as never,
    );

    await service.publish("HOME", 2, actorUserId);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { pageId: "page", usage: { startsWith: "PUBLISHED:" } },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          mediaId,
          usage: "PUBLISHED:HERO_SLIDER:0:media:0",
        }),
      ],
    });
  });

  it("restores revision content and rebuilds its Draft references", async () => {
    const deleteMany = vi.fn(async () => ({ count: 0 }));
    const createMany = vi.fn(async () => ({ count: 1 }));
    const transaction = {
      marketingPage: {
        findUnique: vi.fn(async () => ({ id: "page", version: 3 })),
        update: vi.fn(async () => ({ id: "page", version: 4 })),
      },
      publicMediaAsset: { count: vi.fn(async () => 1) },
      marketingPageMedia: { deleteMany, createMany },
      marketingPageRevision: {
        findFirst: vi.fn(async () => ({ id: "revision", content, seoSnapshot: {} })),
        create: vi.fn(async () => ({ id: "new-revision" })),
      },
    };
    const service = new MarketingService(
      {
        client: {
          $transaction: vi.fn(async (callback: (value: typeof transaction) => unknown) =>
            callback(transaction),
          ),
        },
      } as never,
      { record: vi.fn(async () => undefined) } as never,
    );

    await service.restore("HOME", "revision", { version: 3 }, actorUserId);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { pageId: "page", usage: { startsWith: "DRAFT:" } },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ usage: "DRAFT:HERO_SLIDER:0:media:0" })],
    });
  });
});
