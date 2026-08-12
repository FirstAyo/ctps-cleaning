import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  EditorialServiceAreas,
  EditorialServicesShowcase,
  FeaturedTransformation,
  InsightsPreview,
  PremiumFinalCta,
  PremiumTrustBar,
  ProjectMosaic,
  PropertyTypeSplit,
  ServiceProcessTimeline,
  WhyCtpsEditorial,
} from "../src/components/homepage-sections";
import { MarketingPageRenderer } from "../src/components/marketing-page-renderer";
import type { PublicProject } from "../src/lib/before-after-api";
import type { PublicBlogPost } from "../src/lib/blog-api";
import type { MarketingSection, PublishedMarketingPage } from "../src/lib/marketing-api";

const section = (type: string, items: MarketingSection["items"] = []): MarketingSection => ({
  id: type.toLowerCase(),
  type,
  enabled: true,
  eyebrow: type.replaceAll("_", " "),
  title: `${type} title`,
  body: `${type} CMS body`,
  items,
  mediaIds: [],
  primaryCta: { label: "Primary action", href: "/request-a-quote" },
  secondaryCta: { label: "Secondary action", href: "/contact" },
});
const page: PublishedMarketingPage = {
  pageKey: "HOME",
  slug: "",
  title: "Home",
  publishedContent: { sections: [] },
  seoTitle: null,
  seoDescription: null,
  ogTitle: null,
  ogDescription: null,
  socialImageId: null,
  publishedAt: "2026-08-11T00:00:00.000Z",
  media: [],
};
const media = {
  id: "media-1",
  altText: "Approved property image",
  caption: null,
  width: 1200,
  height: 800,
  variants: {
    original: { path: "/media/example/original", width: 1200, height: 800 },
    large: { path: "/media/example/large", width: 1200, height: 800 },
  },
};
const project: PublicProject = {
  id: "project-1",
  slug: "published-project",
  title: "Published transformation",
  summary: "An approved published project summary.",
  description: "Approved description.",
  status: "PUBLISHED",
  featured: true,
  publishedAt: "2026-08-11T00:00:00.000Z",
  completedAt: null,
  serviceKey: "window-cleaning",
  serviceAreaKey: "vancouver",
  seoTitle: null,
  seoDescription: null,
  primaryBeforeMedia: { ...media, id: "before" },
  primaryAfterMedia: { ...media, id: "after" },
  supportingMedia: [],
};
const post: PublicBlogPost = {
  slug: "published-guidance",
  title: "Published guidance",
  excerpt: "Approved editorial excerpt.",
  content: [],
  featuredMedia: null,
  media: [],
  categories: [{ slug: "care", name: "Property care", description: "" }],
  tags: [],
  author: { slug: null, displayName: "CTPS", bio: "", profileMedia: null },
  seoTitle: null,
  seoDescription: null,
  publishedAt: "2026-08-11T00:00:00.000Z",
  updatedAt: "2026-08-11T00:00:00.000Z",
  readingTimeMinutes: 2,
};
const items = [
  {
    key: "one",
    title: "First CMS item",
    body: "First CMS body",
    href: "/services/window-cleaning",
  },
  {
    key: "two",
    title: "Second CMS item",
    body: "Second CMS body",
    href: "/services/pressure-washing",
  },
  {
    key: "three",
    title: "Third CMS item",
    body: "Third CMS body",
    href: "/services/gutter-cleaning",
  },
  {
    key: "four",
    title: "Fourth CMS item",
    body: "Fourth CMS body",
    href: "/services/moss-removal",
  },
];
const html = (node: React.ReactNode) => renderToStaticMarkup(node);

describe("Phase 11 editorial Homepage", () => {
  it("renders a compact trust bar and CMS-driven editorial services", () => {
    const trust = html(<PremiumTrustBar section={section("TRUST_STRIP", items)} />);
    const services = html(
      <EditorialServicesShowcase page={page} section={section("SERVICE_SHOWCASE", items)} />,
    );
    expect(trust).toContain("home-trust-bar");
    expect(trust).not.toContain("premium-content-card");
    expect(services).toContain("service-editorial-grid");
    expect(services).toContain("First CMS body");
    expect(services).not.toContain("https://");
  });

  it("hides optional project and insight sections without Published records", () => {
    expect(
      html(<FeaturedTransformation project={null} section={section("FEATURED_PROJECT")} />),
    ).toBe("");
    expect(html(<ProjectMosaic projects={[]} section={section("PROJECT_GRID")} />)).toBe("");
    expect(html(<InsightsPreview posts={[]} section={section("BLOG_PREVIEW")} />)).toBe("");
  });

  it("renders published transformation, portfolio, and insights editorially", () => {
    expect(
      html(<FeaturedTransformation project={project} section={section("FEATURED_PROJECT")} />),
    ).toContain("transformation-layout");
    expect(
      html(<ProjectMosaic projects={[project]} section={section("PROJECT_GRID")} />),
    ).toContain("project-mosaic");
    expect(html(<InsightsPreview posts={[post]} section={section("BLOG_PREVIEW")} />)).toContain(
      "insights-layout",
    );
  });

  it("renders distinct property, principles, process, area, and CTA compositions", () => {
    expect(
      html(<PropertyTypeSplit page={page} section={section("RESIDENTIAL_COMMERCIAL", items)} />),
    ).toContain("property-type-split");
    expect(html(<WhyCtpsEditorial section={section("VALUE_PROPOSITION", items)} />)).toContain(
      "why-ctps-list",
    );
    expect(html(<ServiceProcessTimeline section={section("PROCESS", items)} />)).toContain(
      "process-timeline",
    );
    expect(html(<EditorialServiceAreas section={section("SERVICE_AREAS", items)} />)).toContain(
      "service-areas-layout",
    );
    expect(html(<PremiumFinalCta page={page} section={section("FINAL_CTA")} />)).toContain(
      "premium-final-cta",
    );
  });

  it("keeps CMS edits authoritative and omits public empty-state language", () => {
    const edited = section("VALUE_PROPOSITION", [
      { key: "edited", title: "Editorially changed principle" },
    ]);
    const output = html(
      <MarketingPageRenderer
        page={{
          ...page,
          publishedContent: {
            sections: [
              edited,
              section("FEATURED_PROJECT"),
              section("PROJECT_GRID"),
              section("BLOG_PREVIEW"),
            ],
          },
        }}
      />,
    );
    expect(output).toContain("Editorially changed principle");
    expect(output).not.toMatch(/coming soon|no articles|on the way|no project selected/i);
  });
});
