import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "../src/components/foundation-page";

describe("admin foundation page", () => {
  it("does not imply authentication and renders health states", () => {
    const markup = renderToStaticMarkup(
      <FoundationPage environment="test" health={{ api: "available", database: "unavailable" }} />,
    );

    expect(markup).toContain("Admin Application Foundation");
    expect(markup).toContain("unprotected Phase 1 status page");
    expect(markup).toContain("Authentication and admin functionality");
    expect(markup).toContain("Database unavailable");
  });
});
