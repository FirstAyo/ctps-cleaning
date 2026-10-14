import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin production packaging", () => {
  it("copies public brand assets into the standalone runtime image", () => {
    const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8");

    expect(dockerfile).toContain(
      "COPY --from=build --chown=ctps:ctps /workspace/apps/admin/public ./apps/admin/public",
    );
  });
});
