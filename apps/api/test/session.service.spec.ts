import { describe, expect, it, vi } from "vitest";
import { SessionService } from "../src/auth/session.service";
import { TokenService } from "../src/auth/token.service";

const config = {
  value: {
    AUTH_SESSION_COOKIE_NAME: "ctps_admin_session",
    AUTH_COOKIE_SECURE: true,
    AUTH_SESSION_COOKIE_DOMAIN: undefined,
    AUTH_SESSION_ABSOLUTE_SECONDS: 604800,
    AUTH_SESSION_IDLE_SECONDS: 28800,
    AUTH_ACTIVITY_UPDATE_SECONDS: 300,
  },
};

describe("database-backed sessions", () => {
  it("stores only a token hash and emits a secure HttpOnly cookie", async () => {
    const create = vi.fn().mockResolvedValue({ id: "session-id" });
    const database = { client: { session: { create } } };
    const service = new SessionService(database as never, config as never, new TokenService());
    const session = await service.create("user-id");
    const stored = create.mock.calls[0]?.[0].data as { tokenHash: string };
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.tokenHash).not.toBe(session.rawToken);
    const cookie = vi.fn();
    service.setCookie({ cookie } as never, session);
    expect(cookie).toHaveBeenCalledWith(
      "ctps_admin_session",
      session.rawToken,
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: "lax", path: "/" }),
    );
  });
  it.each(["revoked", "absolute-expired", "idle-expired", "disabled"])(
    "rejects a %s session",
    async (condition) => {
      const now = new Date();
      const session = {
        id: "s",
        revokedAt: condition === "revoked" ? now : null,
        absoluteExpiresAt:
          condition === "absolute-expired" ? new Date(0) : new Date(now.getTime() + 60_000),
        idleExpiresAt:
          condition === "idle-expired" ? new Date(0) : new Date(now.getTime() + 60_000),
        lastActivityAt: now,
        createdAt: now,
        csrfTokenHash: null,
        user: {
          id: "u",
          email: "staff@example.com",
          displayName: "Staff",
          mustChangePassword: false,
          status: condition === "disabled" ? "DISABLED" : "ACTIVE",
          roles: [],
        },
      };
      const update = vi.fn().mockResolvedValue({});
      const service = new SessionService(
        {
          client: { session: { findUnique: vi.fn().mockResolvedValue(session), update } },
        } as never,
        config as never,
        new TokenService(),
      );
      expect(await service.validate("raw")).toBeNull();
    },
  );
  it("revokes only an owned non-current session and supports revoking all others", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const service = new SessionService(
      { client: { session: { updateMany } } } as never,
      config as never,
      new TokenService(),
    );
    expect(await service.revokeOwned("u", "other", "current")).toBe(true);
    expect(updateMany.mock.calls[0]?.[0].where).toEqual({
      id: "other",
      userId: "u",
      revokedAt: null,
    });
    expect(await service.revokeOwned("u", "current", "current")).toBe(false);
    await service.revokeOthers("u", "current");
    expect(updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: "u", id: { not: "current" }, revokedAt: null } }),
    );
  });
});
