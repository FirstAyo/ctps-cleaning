import { describe, expect, it } from "vitest";

import {
  CTPS_SERVICE_AREA_KEYS,
  ROUTE_INDEXABILITY_MATRIX,
  assertProductionSiteOrigin,
  blogPostingStructuredData,
  breadcrumbStructuredData,
  canonicalUrl,
  extractInternalLinks,
  organizationStructuredData,
  serializeStructuredData,
  serviceStructuredData,
  websiteStructuredData,
} from "./index";

describe("Phase 12 SEO foundation", () => {
  const origin = "https://www.example.com";

  it("normalizes canonicals and rejects unsafe production origins", () => {
    expect(canonicalUrl(`${origin}/`, "/services/window-cleaning/?utm_source=test#top")).toBe(
      `${origin}/services/window-cleaning`,
    );
    expect(() => canonicalUrl(origin, "/Services")).toThrow(/lowercase/i);
    expect(() => assertProductionSiteOrigin("http://localhost:3000")).toThrow(/HTTPS/i);
    expect(assertProductionSiteOrigin(origin)).toBe(origin);
  });

  it("defines private/token routes as noindex and excludes them from sitemap", () => {
    const privateRules = ROUTE_INDEXABILITY_MATRIX.filter(({ authentication }) =>
      ["STAFF", "TOKEN", "INTERNAL"].includes(authentication),
    );
    expect(privateRules.length).toBeGreaterThan(0);
    expect(
      privateRules.every(({ indexability, sitemap }) => indexability === "NOINDEX" && !sitemap),
    ).toBe(true);
  });

  it("uses exactly the six approved British Columbia area keys", () => {
    expect(CTPS_SERVICE_AREA_KEYS).toEqual([
      "vancouver",
      "richmond",
      "burnaby",
      "surrey",
      "coquitlam",
      "north-vancouver",
    ]);
  });

  it("builds factual Organization, WebSite, Service, BlogPosting, and BreadcrumbList data", () => {
    const schemas = [
      organizationStructuredData({ name: "CTPS", origin }),
      websiteStructuredData({ name: "CTPS", origin }),
      serviceStructuredData({
        name: "Window Cleaning",
        description: "Window care.",
        path: "/services/window-cleaning",
        origin,
      }),
      blogPostingStructuredData({
        headline: "Care guide",
        description: "A guide.",
        path: "/blog/care-guide",
        origin,
        authorName: "Editor",
        datePublished: "2026-01-01T00:00:00.000Z",
        dateModified: "2026-01-02T00:00:00.000Z",
      }),
      breadcrumbStructuredData(origin, [
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
      ]),
    ];
    expect(schemas.map((schema) => schema["@type"])).toEqual([
      "Organization",
      "WebSite",
      "Service",
      "BlogPosting",
      "BreadcrumbList",
    ]);
    expect(JSON.stringify(schemas)).not.toMatch(/aggregateRating|Review|Offer|undefined|null/);
  });

  it("serializes untrusted structured-data strings without executable script breakout", () => {
    const serialized = serializeStructuredData({
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "</script><script>alert(1)</script>&",
    });
    expect(serialized).not.toContain("<script");
    expect(serialized).not.toContain("</script");
    expect(serialized).toContain("\\u003c");
    expect(serialized).toContain("\\u0026");
  });

  it("extracts normalized internal links but not external links", () => {
    expect(
      extractInternalLinks({
        primaryCta: { href: "/Services/window-cleaning?x=1" },
        items: [{ href: "https://example.com" }, { href: "/about/" }],
      }),
    ).toEqual(["/Services/window-cleaning", "/about"]);
  });
});
