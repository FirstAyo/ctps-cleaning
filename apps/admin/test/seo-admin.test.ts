import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Phase 12 Admin SEO workspace", () => {
  const source = readFileSync("src/app/(protected)/seo/page.tsx", "utf8");

  it("provides operational summaries, filters, issue semantics, and editor links", () => {
    expect(source).toContain("SEO health");
    expect(source).toContain("Published page audit");
    expect(source).toContain("MISSING_TITLE");
    expect(source).toContain("MISSING_DESCRIPTION");
    expect(source).toContain("MISSING_IMAGE");
    expect(source).toContain("Open editor");
    expect(source).toContain('aria-label="Filter SEO audit"');
    expect(source).not.toMatch(/SEO score|97\/100/i);
  });
});
