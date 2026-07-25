import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GalleryPage from "../src/app/before-after/page";
import sitemap from "../src/app/sitemap";
import { ProjectDetail } from "../src/components/portfolio";
import type { PublicProject } from "../src/lib/before-after-api";

const media = (id: string, altText: string) => ({
  id,
  altText,
  caption: null,
  width: 800,
  height: 600,
  variants: {
    original: { path: `/media/before-after/${id}/original`, width: 800, height: 600 },
    gallery: { path: `/media/before-after/${id}/gallery`, width: 800, height: 600 },
    large: { path: `/media/before-after/${id}/large`, width: 800, height: 600 },
  },
});

const published: PublicProject = {
  id: "project",
  slug: "window-restoration-vancouver",
  title: "Window restoration in Vancouver",
  summary: "A published exterior window transformation.",
  description: "The project was assessed carefully.\nThe final result was reviewed.",
  status: "PUBLISHED",
  featured: true,
  publishedAt: "2026-07-24T00:00:00.000Z",
  completedAt: "2026-07-01T00:00:00.000Z",
  serviceKey: "window-cleaning",
  serviceAreaKey: "vancouver",
  seoTitle: "Published window restoration",
  seoDescription: "Accessible before-and-after project detail.",
  primaryBeforeMedia: media("before", "Clouded glass before cleaning"),
  primaryAfterMedia: media("after", "Clear glass after cleaning"),
  supportingMedia: [
    {
      id: "support",
      category: "GALLERY",
      sortOrder: 0,
      caption: "Final inspection",
      media: media("support", "Clean window during final inspection"),
    },
  ],
};

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("database-backed public portfolio", () => {
  it("renders an honest empty state when no project is published", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ items: [], page: 1, pageSize: 12, total: 0 })),
        ),
    );
    const html = renderToStaticMarkup(await GalleryPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Published project stories are coming soon");
    expect(html).toContain("0 published projects found");
  });

  it("renders published comparisons, filters, detail copy, and supporting media", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [published], page: 1, pageSize: 12, total: 1 })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const html = renderToStaticMarkup(
      await GalleryPage({
        searchParams: Promise.resolve({ service: "window-cleaning", area: "vancouver" }),
      }),
    );
    expect(html).toContain(published.title);
    expect(html).toContain("Clouded glass before cleaning");
    const requested = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(requested.searchParams.get("serviceKey")).toBe("window-cleaning");
    expect(requested.searchParams.get("serviceAreaKey")).toBe("vancouver");

    const detail = renderToStaticMarkup(<ProjectDetail project={published} />);
    expect(detail).toContain("Project overview");
    expect(detail).toContain("Supporting gallery");
    expect(detail).toContain("Final inspection");
    expect(detail).not.toMatch(/storageKey|privateRoot|\\private\\/i);
  });

  it("includes only API-published project slugs in the dynamic sitemap", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ items: [published], page: 1, pageSize: 24, total: 1 })),
        ),
    );
    const urls = (await sitemap()).map(({ url }) => url);
    expect(urls.some((url) => url.endsWith(`/before-after/${published.slug}`))).toBe(true);
    expect(urls.some((url) => url.includes("private-draft"))).toBe(false);
  });
});
