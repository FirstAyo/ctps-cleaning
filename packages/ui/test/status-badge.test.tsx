import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "../src";

describe("StatusBadge", () => {
  it("exports an accessible textual status with a machine-readable state", () => {
    const markup = renderToStaticMarkup(<StatusBadge label="API reachable" state="available" />);

    expect(markup).toContain("API reachable");
    expect(markup).toContain('data-state="available"');
  });
});
