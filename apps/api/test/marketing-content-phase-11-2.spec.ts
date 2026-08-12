import { marketingPageContentSchema } from "@ctps/validation";
import { describe, expect, it } from "vitest";

import { systemMarketingPages } from "../src/marketing/marketing-content";

const byKey = (key: string) => systemMarketingPages.find((page) => page.pageKey === key)!;

describe("Phase 11.2 fixed marketing catalogue", () => {
  it("keeps every fixed page inside the strict structured schema", () => {
    expect(systemMarketingPages).toHaveLength(20);
    for (const page of systemMarketingPages)
      expect(marketingPageContentSchema.safeParse(page.content).success, page.pageKey).toBe(true);
  });

  it("defines five distinct service identities with premium editorial sections", () => {
    const services = systemMarketingPages.filter((page) => page.pageType === "SERVICE");
    expect(services.map((page) => page.slug)).toEqual([
      "/services/window-cleaning",
      "/services/pressure-washing",
      "/services/gutter-cleaning",
      "/services/moss-removal",
      "/services/vent-cleaning",
    ]);
    for (const page of services) {
      const types = page.content.sections.map(({ type }) => type);
      expect(types).toEqual(
        expect.arrayContaining([
          "HERO_SLIDER",
          "MEDIA_TEXT",
          "VALUE_PROPOSITION",
          "FEATURED_PROJECT",
          "PROCESS",
          "FAQ",
          "RELATED_SERVICES",
          "FINAL_CTA",
        ]),
      );
    }
    expect(new Set(services.map((page) => page.content.sections[0]!.title)).size).toBe(5);
  });

  it("defines exactly six safe British Columbia area pages", () => {
    const areas = systemMarketingPages.filter((page) => page.pageType === "AREA");
    expect(areas.map(({ title }) => title)).toEqual([
      "Vancouver",
      "Richmond",
      "Burnaby",
      "Surrey",
      "Coquitlam",
      "North Vancouver",
    ]);
    expect(JSON.stringify(areas)).not.toMatch(
      /neighbourhood|response time|local office|customer count/i,
    );
  });

  it("keeps contact and quote paths distinct without invented contact details", () => {
    const contact = JSON.stringify(byKey("CONTACT").content);
    expect(contact).toContain("General inquiries");
    expect(contact).toContain("/request-a-quote");
    expect(contact).not.toMatch(/@|\+1|street|open daily/i);
  });

  it("adds controlled portfolio and journal landing records without changing domain ownership", () => {
    expect(byKey("BEFORE_AFTER").slug).toBe("/before-after");
    expect(byKey("BLOG").slug).toBe("/blog");
    expect(JSON.stringify([byKey("BEFORE_AFTER"), byKey("BLOG")])).not.toMatch(
      /storageKey|rawHtml|script/i,
    );
  });
});
