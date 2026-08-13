import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import robots from "../src/app/robots";
import { serviceAreas, services } from "../src/content/site";
import {
  breadcrumbSchema,
  metadataFor,
  noIndexFollowMetadata,
  noIndexMetadata,
  organizationSchema,
  serviceSchema,
  websiteSchema,
} from "../src/lib/seo";

describe("Phase 12 public SEO", () => {
  it("creates complete self-canonical metadata", () => {
    const metadata = metadataFor(
      "Window Cleaning",
      "Thoughtful window care for residential and commercial properties.",
      "/services/window-cleaning?utm_source=test",
      { image: { url: "/images/services/window-cleaning.svg", alt: "Bright window" } },
    );
    expect(metadata.title).toBe("Window Cleaning | CTPS");
    expect(metadata.alternates).toEqual({
      canonical: "http://localhost:3000/services/window-cleaning",
    });
    expect(metadata.openGraph).toMatchObject({
      url: "http://localhost:3000/services/window-cleaning",
      siteName: "CTPS",
      title: "Window Cleaning | CTPS",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("does not produce a canonical for private/tokenized views", () => {
    const metadata = noIndexMetadata("Estimate Result", "Private preliminary estimate result.");
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toMatchObject({ index: false, follow: false, noarchive: true });
  });

  it("keeps crawlable Blog filters noindex while allowing link discovery", () => {
    const metadata = noIndexFollowMetadata("Filtered Blog Articles", "Filtered listing.");
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });

  it("uses centralized factual schemas and exact area/service identities", () => {
    expect(organizationSchema.areaServed).toHaveLength(6);
    expect(websiteSchema["@type"]).toBe("WebSite");
    expect(
      serviceSchema({
        name: services[0]!.name,
        description: services[0]!.summary,
        path: `/services/${services[0]!.slug}`,
      })["@type"],
    ).toBe("Service");
    expect(
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
      ])["@type"],
    ).toBe("BreadcrumbList");
    expect(serviceAreas.map(({ slug }) => slug)).toEqual([
      "vancouver",
      "richmond",
      "burnaby",
      "surrey",
      "coquitlam",
      "north-vancouver",
    ]);
  });

  it("allows public crawling only when the explicit indexing switch is enabled", () => {
    const output = robots();
    expect(output.sitemap).toBe("http://localhost:3000/sitemap.xml");
    expect(output.rules).toMatchObject({ allow: "/" });
    expect(JSON.stringify(output.rules)).toContain("/estimate/results/");
  });

  it("keeps every major public template on intentional metadata architecture", () => {
    const pages = [
      "page.tsx",
      "services/page.tsx",
      "services/[slug]/page.tsx",
      "residential/page.tsx",
      "commercial/page.tsx",
      "about/page.tsx",
      "contact/page.tsx",
      "service-areas/page.tsx",
      "service-areas/[slug]/page.tsx",
      "before-after/page.tsx",
      "before-after/[slug]/page.tsx",
      "blog/page.tsx",
      "blog/[slug]/page.tsx",
      "request-a-quote/page.tsx",
      "estimate/page.tsx",
    ];
    for (const page of pages) {
      const source = readFileSync(`src/app/${page}`, "utf8");
      expect(source, page).toMatch(/metadataFor|getMarketingMetadata/);
    }
  });
});
