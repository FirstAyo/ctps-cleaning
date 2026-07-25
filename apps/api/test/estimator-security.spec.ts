import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PERMISSION_KEYS } from "@ctps/permissions";

describe("Phase 7 estimator security boundaries", () => {
  const service = readFileSync(
    resolve(process.cwd(), "src/estimator/estimator.service.ts"),
    "utf8",
  );
  const schema = readFileSync(
    resolve(process.cwd(), "../../packages/database/prisma/schema.prisma"),
    "utf8",
  );
  it("uses high-entropy random opaque tokens and stores only hashes", () => {
    expect(service).toContain("randomBytes(32)");
    expect(service).toContain("tokenAttempt < 3");
    expect(service).toContain("tokenAttempt < 2");
    expect(schema).toContain("publicTokenHash       String         @unique");
    expect(schema).toContain("transferTokenHash     String?        @unique");
  });
  it("persists idempotency uniquely and keeps internal traces separate", () => {
    expect(schema).toContain("idempotencyKeyHash    String         @unique");
    expect(service).toContain("calculationTrace");
    expect(service).not.toMatch(/safeResult[\s\S]{0,1000}calculationTrace/);
  });
  it("has distinct publication and trace permissions", () => {
    expect(PERMISSION_KEYS.PRICING_VERSIONS_PUBLISH).toBe("pricingVersions.publish");
    expect(PERMISSION_KEYS.ESTIMATOR_RESULTS_READ_CALCULATION_TRACE).toBe(
      "estimatorResults.readCalculationTrace",
    );
  });
  it("never supports arbitrary evaluation", () => {
    expect(service).not.toMatch(/\beval\s*\(|new Function/);
  });
});
