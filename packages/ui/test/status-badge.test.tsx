import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button, StatusBadge } from "../src";

describe("shared status and button primitives", () => {
  it("pairs status color with textual and machine-readable meaning", () => {
    const markup = renderToStaticMarkup(<StatusBadge label="API reachable" state="available" />);
    expect(markup).toContain("API reachable");
    expect(markup).toContain('data-state="available"');
    expect(markup).toContain("✓");
  });

  it("preserves loading semantics and disables repeat activation", () => {
    const markup = renderToStaticMarkup(<Button loading>Save example</Button>);
    expect(markup).toContain("disabled");
    expect(markup).toContain("Save example");
    expect(markup).toContain("Loading");
  });
});
