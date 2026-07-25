import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import sitemap from "../src/app/sitemap";
import HomePage from "../src/app/page";
import RequestQuotePage from "../src/app/request-a-quote/page";
import { ServicePageContent, AreaPageContent } from "../src/components/marketing";
import {
  BeforeAfterPage,
  BlogPage,
  ContactPage,
  FaqPage,
  ServicesOverviewPage,
} from "../src/components/public-pages";
import { getService, getServiceArea, serviceAreas, services } from "../src/content/site";

function markup(node: React.ReactNode) {
  return renderToStaticMarkup(node);
}
function sourceFiles(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const target = join(path, name);
    return statSync(target).isDirectory()
      ? sourceFiles(target)
      : /\.(tsx?|css)$/.test(name)
        ? [target]
        : [];
  });
}

describe("Phase 4 public marketing", () => {
  it("renders the complete homepage conversion architecture", async () => {
    const html = markup(await HomePage());
    for (const section of [
      "Property care without template thinking",
      "Approved project stories are on the way",
      "Clarity is part of the service",
      "A four-step, quote-based process",
      "Metro Vancouver coverage",
      "A place reserved for verified voices",
      "Useful guidance, with publishing still ahead",
    ])
      expect(html).toContain(section);
  });

  it("renders the service overview and every configured service template", () => {
    expect(markup(<ServicesOverviewPage />)).toContain("One property. A coordinated view of care.");
    expect(services).toHaveLength(5);
    for (const service of services) {
      const resolved = getService(service.slug);
      expect(resolved).toBeDefined();
      const html = markup(<ServicePageContent service={service} />);
      expect(html).toContain(service.name);
      expect(html).toContain("Inquiry before confirmation");
      expect(html).toContain("Development demonstration");
    }
  });

  it("renders all six distinct service-area templates", () => {
    expect(serviceAreas).toHaveLength(6);
    for (const area of serviceAreas) {
      expect(getServiceArea(area.slug)).toBeDefined();
      const html = markup(<AreaPageContent area={area} />);
      expect(html).toContain(area.name);
      expect(html).toContain(area.perspective);
    }
  });

  it("keeps the quote workflow active without implying booking or final pricing", () => {
    const quote = markup(<RequestQuotePage />);
    expect(quote).toContain("Step 1 of 8");
    expect(quote).toContain("Property type");
    expect(quote).toContain("This is not a price, appointment, or booking");
    expect(markup(<ContactPage />)).toContain("Contact submission not active");
  });

  it("renders accessible FAQ, comparison, and editorial foundations without fake records", () => {
    expect(markup(<FaqPage />)).toContain("Can I book a service online?");
    expect(markup(<BeforeAfterPage />)).toContain("Before and after comparison");
    const blog = markup(<BlogPage />);
    expect(blog).toContain("Planned topic");
    expect(blog).not.toContain("Published on");
  });

  it("uses local image references and no external image URLs in public source", () => {
    const root = join(process.cwd(), "src");
    const combined = sourceFiles(root)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(combined).not.toMatch(/(?:src|image):?\s*[={\"']+https?:\/\//i);
    for (const service of services) expect(service.image.startsWith("/images/")).toBe(true);
  });

  it("publishes all marketing routes while excluding development/admin routes", async () => {
    const urls = (await sitemap()).map((item) => item.url);
    expect(urls).toHaveLength(23);
    expect(urls.some((url) => url.endsWith("/services/window-cleaning"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/service-areas/north-vancouver"))).toBe(true);
    expect(urls.some((url) => url.includes("design-system"))).toBe(false);
    expect(urls.some((url) => url.includes("admin"))).toBe(false);
  });
});
