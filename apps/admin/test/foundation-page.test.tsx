import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminDesignSystem } from "../src/components/admin-design-system";
import { FoundationPage } from "../src/components/foundation-page";

describe("admin Phase 2 routes", () => {
  it("does not imply authentication and retains health states", () => {
    const markup = renderToStaticMarkup(
      <FoundationPage environment="test" health={{ api: "available", database: "unavailable" }} />,
    );
    expect(markup).toContain("Admin design foundation");
    expect(markup).toContain("Authentication is not implemented");
    expect(markup).toContain("unprotected Phase 2 status page");
    expect(markup).toContain("Database unavailable");
  });

  it("renders a neutral component gallery without customer data", () => {
    const markup = renderToStaticMarkup(<AdminDesignSystem />);
    expect(markup).toContain("Data-table foundation");
    expect(markup).toContain("Example Request A");
    expect(markup).toContain("No staff session or permissions exist");
  });
});
