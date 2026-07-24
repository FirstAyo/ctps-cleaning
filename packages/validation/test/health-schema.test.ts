import { describe, expect, it } from "vitest";

import { apiHealthResponseSchema, databaseHealthResponseSchema } from "../src";

describe("health response schemas", () => {
  it("accepts the stable API liveness response", () => {
    const result = apiHealthResponseSchema.safeParse({
      success: true,
      status: "ok",
      service: "ctps-api",
      timestamp: "2026-07-24T12:00:00.000Z",
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
});
