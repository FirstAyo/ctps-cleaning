import { describe, expect, it } from "vitest";

import { apiEnvironmentSchema, changePasswordSchema, createUserSchema, loginSchema } from "../src";

describe("authentication validation", () => {
  it("normalizes staff email without changing the password", () => {
    const value = loginSchema.parse({ email: " Staff@Example.COM ", password: " pass phrase " });
    expect(value).toEqual({ email: "staff@example.com", password: " pass phrase " });
  });

  it("enforces password length, confirmation, and reuse rules", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old password value",
        newPassword: "old password value",
        confirmPassword: "old password value",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old password value",
        newPassword: "a different secure passphrase",
        confirmPassword: "does not match",
      }).success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old password value",
        newPassword: "a different secure passphrase",
        confirmPassword: "a different secure passphrase",
      }).success,
    ).toBe(true);
  });

  it("rejects customer fields at the staff creation boundary", () => {
    const value = createUserSchema.parse({
      displayName: "Example Staff",
      email: "staff@example.com",
      roleIds: [],
      phone: "not accepted",
    });
    expect("phone" in value).toBe(false);
  });

  it("applies conservative session and throttle defaults", () => {
    const value = apiEnvironmentSchema.parse({
      ADMIN_URL: "http://localhost:3001",
      WEB_URL: "http://localhost:3000",
      API_PORT: "4000",
      CORS_ALLOWED_ORIGINS: "http://localhost:3001",
      DATABASE_URL: "postgresql://local",
      NODE_ENV: "test",
    });
    expect(value.AUTH_SESSION_IDLE_SECONDS).toBe(28_800);
    expect(value.AUTH_SESSION_ABSOLUTE_SECONDS).toBe(604_800);
    expect(value.LOGIN_THROTTLE_MAX_ATTEMPTS).toBe(8);
  });

  it("refuses insecure cookies in production", () => {
    const result = apiEnvironmentSchema.safeParse({
      ADMIN_URL: "https://admin.example.com",
      WEB_URL: "https://example.com",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      API_PORT: "4000",
      AUTH_COOKIE_SECURE: "false",
      CORS_ALLOWED_ORIGINS: "https://admin.example.com",
      DATABASE_URL: "postgresql://local",
      NODE_ENV: "production",
    });
    expect(result.success).toBe(false);
  });
});
