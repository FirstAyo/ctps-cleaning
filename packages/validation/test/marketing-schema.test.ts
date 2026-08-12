import { describe, expect, it } from "vitest";
import {
  marketingPageContentSchema,
  marketingPageUpdateSchema,
  navigationUpdateSchema,
  publicMediaListQuerySchema,
} from "../src";

const hero = {
  id: "hero",
  type: "HERO_SLIDER" as const,
  enabled: true,
  eyebrow: "Property care",
  title: "A considered approach",
  body: "Clear residential and commercial property-care context.",
  primaryCta: { label: "Request a Quote", href: "/request-a-quote" },
  mediaIds: [] as string[],
  overlay: "BALANCED" as const,
  autoplay: true,
  intervalMs: 7000 as const,
};
describe("structured marketing content", () => {
  it("accepts the controlled Hero settings", () => {
    expect(marketingPageContentSchema.parse({ sections: [hero] }).sections[0]).toMatchObject({
      intervalMs: 7000,
      overlay: "BALANCED",
    });
  });
  it("limits Hero media to four managed identifiers", () => {
    expect(
      marketingPageContentSchema.safeParse({
        sections: [
          {
            ...hero,
            mediaIds: [
              crypto.randomUUID(),
              crypto.randomUUID(),
              crypto.randomUUID(),
              crypto.randomUUID(),
              crypto.randomUUID(),
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("rejects duplicate section IDs and multiple heroes", () => {
    expect(marketingPageContentSchema.safeParse({ sections: [hero, { ...hero }] }).success).toBe(
      false,
    );
  });
  it("rejects arbitrary fields, scripts, and off-site navigation", () => {
    expect(
      marketingPageUpdateSchema.safeParse({
        version: 1,
        title: "Home",
        draftContent: { sections: [{ ...hero, html: "<script>alert(1)</script>" }] },
      }).success,
    ).toBe(false);
    expect(
      navigationUpdateSchema.safeParse({
        items: [
          {
            systemKey: "ABOUT",
            label: "About",
            href: "https://example.com",
            enabled: true,
            sortOrder: 1,
            version: 1,
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("bounds public Media Library pagination and accepts controlled filters", () => {
    expect(
      publicMediaListQuerySchema.parse({
        page: "2",
        pageSize: "24",
        search: "window cleaning",
        filter: "LANDSCAPE",
        status: "READY",
      }),
    ).toEqual({
      page: 2,
      pageSize: 24,
      search: "window cleaning",
      filter: "LANDSCAPE",
      status: "READY",
    });
    expect(publicMediaListQuerySchema.safeParse({ pageSize: 500 }).success).toBe(false);
    expect(publicMediaListQuerySchema.safeParse({ filter: "PRIVATE_JOB_MEDIA" }).success).toBe(
      false,
    );
  });
});
