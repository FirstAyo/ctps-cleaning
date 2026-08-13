import { PERMISSION_KEYS } from "@ctps/permissions";
import { describe, expect, it } from "vitest";

import { REQUIRED_PERMISSIONS_KEY } from "../src/auth/security.decorators";
import { SeoController } from "../src/seo/seo.controller";

describe("Phase 12 SEO API security", () => {
  it("requires the granular SEO view permission", () => {
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, SeoController.prototype.overview)).toEqual(
      [PERMISSION_KEYS.SEO_VIEW],
    );
  });
});
