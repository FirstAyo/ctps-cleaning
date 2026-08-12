import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MarketingPageRenderer } from "../src/components/marketing-page-renderer";
import { serviceAreas, services } from "../src/content/site";
import type { MarketingSection, PublishedMarketingPage } from "../src/lib/marketing-api";

const section = (type: string, id = type.toLowerCase()): MarketingSection => ({
  id,
  type,
  enabled: true,
  eyebrow: "Editorial context",
  title: `${type} controlled heading`,
  body: `${type} controlled supporting copy`,
  mediaIds: [],
  items: services.slice(0, 3).map(({ slug, name, summary }) => ({
    key: slug,
    title: name,
    body: summary,
    href: `/services/${slug}`,
  })),
  projectIds: [],
  postIds: [],
});
const page = (pageKey: string, sections: MarketingSection[]): PublishedMarketingPage => ({
  pageKey,
  slug: "/services",
  title: "Controlled page",
  publishedContent: { sections },
  seoTitle: null,
  seoDescription: null,
  ogTitle: null,
  ogDescription: null,
  socialImageId: null,
  publishedAt: "2026-08-12T00:00:00.000Z",
  media: [],
});

describe("Phase 11.2 public editorial compositions", () => {
  it("renders Services as an editorial catalogue rather than a generic card grid", () => {
    const output = renderToStaticMarkup(
      <MarketingPageRenderer
        page={page("SERVICES", [
          section("RICH_TEXT"),
          section("SERVICE_SHOWCASE"),
          section("PROCESS"),
        ])}
      />,
    );
    expect(output).toContain("service-catalogue-list");
    expect(output).toContain("marketing-process");
    expect(output).not.toContain("premium-card-grid");
    for (const service of services) expect(service.slug).toMatch(/^[a-z-]+$/);
  });

  it("renders media, principles, property contexts, FAQs, areas, and related links with distinct structures", () => {
    const areaSection = {
      ...section("SERVICE_AREAS"),
      items: serviceAreas.map(({ slug, name, summary }) => ({
        key: slug,
        title: name,
        body: summary,
        href: `/service-areas/${slug}`,
      })),
    };
    const output = renderToStaticMarkup(
      <MarketingPageRenderer
        page={page("ABOUT", [
          section("MEDIA_TEXT"),
          section("VALUE_PROPOSITION"),
          section("RESIDENTIAL_COMMERCIAL"),
          areaSection,
          section("FAQ"),
          section("RELATED_SERVICES"),
        ])}
      />,
    );
    expect(output).toContain("marketing-media-text");
    expect(output).toContain("marketing-principles");
    expect(output).toContain("marketing-property-types");
    expect(output).toContain("marketing-area-list");
    expect(output).toContain("marketing-faq");
    expect(output).toContain("marketing-related");
    expect(serviceAreas).toHaveLength(6);
  });

  it("hides project proof when no selected Published project is available", () => {
    const output = renderToStaticMarkup(
      <MarketingPageRenderer
        page={page("SERVICE_WINDOW_CLEANING", [section("FEATURED_PROJECT")])}
        projects={[]}
      />,
    );
    expect(output).not.toContain("marketing-project-proof");
    expect(output).not.toMatch(/coming soon|no project selected/i);
  });

  it("uses CMS media through optimized marketing routes with focal-point positioning", () => {
    const id = crypto.randomUUID();
    const mediaSection = { ...section("MEDIA_TEXT"), mediaIds: [id] };
    const output = renderToStaticMarkup(
      <MarketingPageRenderer
        page={{
          ...page("COMMERCIAL", [mediaSection]),
          media: [
            { id, altText: "Approved commercial property", focalPointX: 35, focalPointY: 65 },
          ],
        }}
      />,
    );
    expect(output).toContain(`%2Fmedia%2Fmarketing%2F${id}%2Flarge`);
    expect(output).toContain("35% 65%");
    expect(output).toContain("Approved commercial property");
  });
});
