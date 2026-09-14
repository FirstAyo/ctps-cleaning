import { ServiceUnavailableException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ESTIMATOR_UNAVAILABLE_MESSAGE,
  EstimatorService,
  isDevelopmentPricingVersionCode,
} from "../src/estimator/estimator.service";

const originalEnvironment = { ...process.env };

describe("production estimator pricing gate", () => {
  beforeEach(() => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      ADMIN_URL: "https://admin.example.com",
      WEB_URL: "https://www.example.com",
      NEXT_PUBLIC_SITE_URL: "https://www.example.com",
      DATABASE_URL: "postgresql://ctps:test@postgres:5432/ctps",
      CORS_ALLOWED_ORIGINS: "https://www.example.com,https://admin.example.com",
      AUTH_COOKIE_SECURE: "true",
      TRUST_PROXY_HOPS: "1",
      EMAIL_DELIVERY_MODE: "smtp",
      EMAIL_FROM: "sender@example.com",
      QUOTE_STAFF_EMAIL: "staff@example.com",
      SMTP_HOST: "smtp.example.com",
      RELEASE_VERSION: "phase-13-2-test",
    });
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
    vi.restoreAllMocks();
  });

  it.each(["DEV-INITIAL-REQUIRES-APPROVAL", "2026-Q3-DRAFT", "pricing.test.1", "SAMPLE-2026"])(
    "recognizes the development marker in %s",
    (versionCode) => {
      expect(isDevelopmentPricingVersionCode(versionCode)).toBe(true);
    },
  );

  it("does not classify a production-style code as development pricing", () => {
    expect(isDevelopmentPricingVersionCode("2026-Q3-APPROVED")).toBe(false);
  });

  it("fails closed without exposing a Published development version", async () => {
    const findMany = vi.fn(async () => [
      { versionCode: "2026-Q3-DRAFT", configurations: [], effectiveFrom: new Date() },
    ]);
    const service = new EstimatorService(
      { client: { pricingVersion: { findMany } } } as never,
      { record: vi.fn() } as never,
    );
    await expect(service.publicConfiguration()).rejects.toMatchObject({
      response: { code: "ESTIMATOR_UNAVAILABLE", message: ESTIMATOR_UNAVAILABLE_MESSAGE },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PUBLISHED", effectiveFrom: expect.any(Object) }),
        take: 2,
      }),
    );
  });

  it("fails closed when the effective Published configuration is missing or incomplete", async () => {
    for (const versions of [[], [{ versionCode: "2026-Q3-APPROVED", configurations: [] }]]) {
      const service = new EstimatorService(
        { client: { pricingVersion: { findMany: vi.fn(async () => versions) } } } as never,
        { record: vi.fn() } as never,
      );
      await expect(service.publicConfiguration()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    }
  });
});
