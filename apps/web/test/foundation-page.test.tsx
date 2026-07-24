import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "../src/components/foundation-page";

describe("public foundation page", () => {
  it("states the implementation boundary and renders unavailable health safely", () => {
    const markup = renderToStaticMarkup(
      <FoundationPage environment="test" health={{ api: "unavailable", database: "unknown" }} />,
    );

    expect(markup).toContain("Public Website Foundation");
    expect(markup).toContain("business features are not implemented yet");
    expect(markup).toContain("API unavailable");
    expect(markup).toContain("Database status unknown");
  });
});
