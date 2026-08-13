import { describe, expect, it, vi } from "vitest";

import { SeoService } from "../src/seo/seo.service";

describe("Phase 12 deterministic SEO audit", () => {
  it("reports missing metadata, duplicates, thin content, and broken internal links", async () => {
    const content = {
      sections: [
        {
          id: "hero",
          type: "HERO_SLIDER",
          enabled: true,
          title: "Local care",
          body: "Brief copy",
          primaryCta: { label: "Broken", href: "/missing-page" },
        },
      ],
    };
    const marketing = ["VANCOUVER", "RICHMOND"].map((key, index) => ({
      id: `page-${index}`,
      pageKey: `AREA_${key}`,
      slug: `/service-areas/${key.toLocaleLowerCase()}`,
      title: `${key} services`,
      pageType: "AREA",
      publishedContent: content,
      seoTitle: "Shared area title",
      seoDescription: "Shared area description",
      socialImageId: null,
      socialImage: null,
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    }));
    const client = {
      marketingPage: { findMany: vi.fn().mockResolvedValue(marketing) },
      blogPost: { findMany: vi.fn().mockResolvedValue([]) },
      beforeAfterProject: { findMany: vi.fn().mockResolvedValue([]) },
      blogSlugRedirect: { count: vi.fn().mockResolvedValue(2) },
      blogCategory: { count: vi.fn().mockResolvedValue(0) },
      navigationItem: { findMany: vi.fn().mockResolvedValue([{ href: "/service-areas" }]) },
    };
    const result = await new SeoService({ client } as never).overview();
    const codes = result.issues.map(({ code }) => code);
    expect(codes).toContain("DUPLICATE_TITLE");
    expect(codes).toContain("DUPLICATE_DESCRIPTION");
    expect(codes).toContain("SERVICE_AREA_DUPLICATE_CONTENT");
    expect(codes).toContain("THIN_CONTENT");
    expect(codes).toContain("BROKEN_INTERNAL_LINK");
    expect(codes).toContain("MISSING_SOCIAL_IMAGE");
    expect(result.summary.redirects).toBe(2);
    expect(result.summary.errors).toBe(2);
  });

  it("does not include Draft, Scheduled, Archived, or future content in its queries", async () => {
    const client = {
      marketingPage: { findMany: vi.fn().mockResolvedValue([]) },
      blogPost: { findMany: vi.fn().mockResolvedValue([]) },
      beforeAfterProject: { findMany: vi.fn().mockResolvedValue([]) },
      blogSlugRedirect: { count: vi.fn().mockResolvedValue(0) },
      blogCategory: { count: vi.fn().mockResolvedValue(0) },
      navigationItem: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await new SeoService({ client } as never).overview();
    expect(client.marketingPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }) }),
    );
    expect(client.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PUBLISHED",
          publishedAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      }),
    );
    expect(client.beforeAfterProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } }),
    );
  });
});
