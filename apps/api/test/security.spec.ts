import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import { describe, expect, it, vi } from "vitest";

import { AuditService, sanitizeAuditMetadata } from "../src/auth/audit.service";
import { AuthenticationGuard } from "../src/auth/auth.guard";
import { CsrfGuard } from "../src/auth/csrf.guard";
import { PasswordService } from "../src/auth/password.service";
import { PermissionGuard } from "../src/auth/permission.guard";
import { TokenService } from "../src/auth/token.service";

function contextWith(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

describe("password and token security", () => {
  it("hashes with Argon2id without retaining plaintext and verifies correctly", async () => {
    const service = new PasswordService();
    const password = "a long staff passphrase";
    const hash = await service.hash(password);
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain(password);
    expect(await service.verify(hash, password)).toBe(true);
    expect(await service.verify(hash, "incorrect password")).toBe(false);
  });
  it("creates 256-bit opaque tokens and stable one-way hashes", () => {
    const service = new TokenService();
    const token = service.generateToken();
    const hash = service.hashToken(token);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
    expect(service.safelyMatches(token, hash)).toBe(true);
    expect(service.safelyMatches(`${token}x`, hash)).toBe(false);
  });
});

describe("audit metadata", () => {
  it("recursively removes credentials, secrets, and managed-storage paths", async () => {
    const safe = sanitizeAuditMetadata({
      email: "staff@example.com",
      password: "bad",
      nested: { csrfToken: "bad", outcome: "ok" },
      cookieHeader: "bad",
      tokenHash: "bad",
      storageKey: "private/internal.webp",
      filePath: "C:\\private\\internal.webp",
    });
    expect(safe).toEqual({ email: "staff@example.com", nested: { outcome: "ok" } });
    const create = vi.fn().mockResolvedValue({});
    const audit = new AuditService({ client: { auditLog: { create } } } as never);
    await audit.record({
      action: "test",
      resourceType: "security",
      metadata: { secret: "bad", safe: true },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ metadata: { safe: true } }),
    });
  });
});

describe("request guards", () => {
  it("returns 401 when a protected request has no valid session", async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    const sessions = { validate: vi.fn().mockResolvedValue(null) };
    const config = { value: { AUTH_SESSION_COOKIE_NAME: "session" } };
    const guard = new AuthenticationGuard(reflector as never, sessions as never, config as never);
    await expect(
      guard.canActivate(contextWith({ cookies: {}, path: "/admin/users" })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it("allows only explicitly optional requests to proceed without a session", async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    };
    const guard = new AuthenticationGuard(
      reflector as never,
      { validate: vi.fn().mockResolvedValue(null) } as never,
      { value: { AUTH_SESSION_COOKIE_NAME: "session" } } as never,
    );
    await expect(
      guard.canActivate(contextWith({ cookies: {}, path: "/auth/logout" })),
    ).resolves.toBe(true);
  });
  it("blocks mandatory-password users outside the password flow", async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    const sessions = { validate: vi.fn().mockResolvedValue({ mustChangePassword: true }) };
    const guard = new AuthenticationGuard(
      reflector as never,
      sessions as never,
      { value: { AUTH_SESSION_COOKIE_NAME: "session" } } as never,
    );
    await expect(
      guard.canActivate(contextWith({ cookies: { session: "raw" }, path: "/dashboard" })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it("requires every declared permission", () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([PERMISSION_KEYS.USERS_READ]) };
    const guard = new PermissionGuard(reflector as never);
    expect(() => guard.canActivate(contextWith({ auth: { permissions: [] } }))).toThrow(
      ForbiddenException,
    );
    expect(
      guard.canActivate(contextWith({ auth: { permissions: [PERMISSION_KEYS.USERS_READ] } })),
    ).toBe(true);
  });
  it("accepts only a valid session-bound CSRF header on unsafe requests", () => {
    const tokens = new TokenService();
    const raw = tokens.generateToken();
    const request = {
      method: "POST",
      auth: { csrfTokenHash: tokens.hashToken(raw) },
      header: (name: string) => (name === "x-csrf-token" ? raw : undefined),
    };
    const guard = new CsrfGuard(
      { getAllAndOverride: vi.fn().mockReturnValue(false) } as never,
      tokens,
    );
    expect(guard.canActivate(contextWith(request))).toBe(true);
    request.header = () => undefined;
    expect(() => guard.canActivate(contextWith(request))).toThrow(ForbiddenException);
    request.header = () => "wrong";
    expect(() => guard.canActivate(contextWith(request))).toThrow(ForbiddenException);
  });
});
