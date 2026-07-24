import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "../src/components/foundation-page";
import { PublicDesignSystem } from "../src/components/public-design-system";

describe("preserved Phase 2 routes", () => {
  it("preserves health visibility while stating the implementation boundary", () => {
    const markup = renderToStaticMarkup(
      <FoundationPage environment="test" health={{ api: "unavailable", database: "unknown" }} />,
    );
    expect(markup).toContain("Premium public design foundation");
    expect(markup).toContain("not the final CTPS homepage");
    expect(markup).toContain("API unavailable");
    expect(markup).toContain("Database status unknown");
  });

  it("renders the design-system inventory and comparison prototype", () => {
    const markup = renderToStaticMarkup(<PublicDesignSystem />);
    expect(markup).toContain("Clean precision, expressed with restraint");
    expect(markup).toContain("Before and after comparison");
    expect(markup).toContain("Form controls");
  });
});
