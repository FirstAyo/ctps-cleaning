import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
describe("public estimator integration", () => {
  it("uses a six-step accessible preliminary workflow", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/estimator-form.tsx"),
      "utf8",
    );
    expect(source).toContain(
      'const steps = ["Service", "Property", "Location", "Details", "Review", "Calculate"]',
    );
    expect(source).toContain("preliminary range");
    expect(source).toContain("fieldset");
  });
  it("keeps result pages out of indexing and transfers through an opaque token", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/estimate/results/[token]/page.tsx"),
      "utf8",
    );
    const actions = readFileSync(
      resolve(process.cwd(), "src/components/estimate-result-actions.tsx"),
      "utf8",
    );
    expect(page).toContain("index: false");
    expect(actions).toContain("quote-transfer");
  });
});
