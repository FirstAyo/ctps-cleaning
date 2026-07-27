import { describe, expect, it } from "vitest";
import { apiEnvironmentSchema } from "@ctps/validation";
import { requestIdFrom } from "../src/common/request-context.middleware";

const productionEnvironment = {
  NODE_ENV: "production",
  ADMIN_URL: "https://admin.ctps.example.com",
  WEB_URL: "https://ctps.example.com",
  DATABASE_URL: "postgresql://ctps:strong-password@postgres:5432/ctps",
  CORS_ALLOWED_ORIGINS: "https://ctps.example.com,https://admin.ctps.example.com",
  AUTH_COOKIE_SECURE: "true",
  TRUST_PROXY_HOPS: "1",
  LOG_FORMAT: "json",
  RELEASE_VERSION: "release-2026.07.25",
  EMAIL_DELIVERY_MODE: "smtp",
  EMAIL_FROM: "sender@ctps.example.com",
  QUOTE_STAFF_EMAIL: "quotes@ctps.example.com",
  SMTP_HOST: "smtp.ctps.example.com",
};

describe("Phase 10 production hardening", () => {
  it("accepts a complete HTTPS production boundary", () => {
    expect(apiEnvironmentSchema.safeParse(productionEnvironment).success).toBe(true);
  });

  it("rejects insecure cookies, untrusted proxy configuration, and development email mode", () => {
    const result = apiEnvironmentSchema.safeParse({
      ...productionEnvironment,
      AUTH_COOKIE_SECURE: "false",
      TRUST_PROXY_HOPS: "0",
      EMAIL_DELIVERY_MODE: "log-safe",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["AUTH_COOKIE_SECURE", "TRUST_PROXY_HOPS", "EMAIL_DELIVERY_MODE"]),
      );
  });

  it("accepts only bounded correlation identifiers and replaces unsafe input", () => {
    const safe = requestIdFrom({ header: () => "release-check_123" } as never);
    const unsafe = requestIdFrom({ header: () => "../../token?customer=email" } as never);
    expect(safe).toBe("release-check_123");
    expect(unsafe).toMatch(/^[0-9a-f-]{36}$/);
  });
});
