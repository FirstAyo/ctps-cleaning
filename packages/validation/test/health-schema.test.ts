import { describe, expect, it } from "vitest";

import {
  apiHealthResponseSchema,
  apiReadinessResponseSchema,
  databaseHealthResponseSchema,
} from "../src";

describe("health response schemas", () => {
  it("accepts the stable API liveness response", () => {
    const result = apiHealthResponseSchema.safeParse({
      success: true,
      status: "ok",
      service: "ctps-api",
      timestamp: "2026-07-24T12:00:00.000Z",
      release: "2026.07.25",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a database response that leaks an unexpected error field", () => {
    const result = databaseHealthResponseSchema.safeParse({
      success: false,
      status: "unavailable",
      database: "connected",
      timestamp: "not-a-date",
      error: "postgresql://secret",
    });

    expect(result.success).toBe(false);
  });

  it("accepts safe readiness without paths or credentials", () => {
    expect(
      apiReadinessResponseSchema.safeParse({
        success: true,
        status: "ready",
        database: "connected",
        storage: "writable",
        timestamp: "2026-07-25T12:00:00.000Z",
        release: "release-10",
      }).success,
    ).toBe(true);
  });
});
