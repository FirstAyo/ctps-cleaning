import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
describe("pricing administration", () => {
  const editor = readFileSync(
    resolve(process.cwd(), "src/components/pricing-version-editor.tsx"),
    "utf8",
  );
  it("uses structured fields and immutable published guidance", () => {
    expect(editor).toContain("Base minimum (cents)");
    expect(editor).toContain("Published versions are immutable");
    expect(editor).not.toMatch(/formula|eval\(/i);
  });
  it("requires explicit publication and destructive confirmation", () => {
    expect(editor).toContain("Validate and publish");
    expect(editor).toContain("confirm(");
  });
});
