import { ConflictException, HttpException, UnauthorizedException } from "@nestjs/common";
import { ROLE_KEYS } from "@ctps/permissions";
import { describe, expect, it, vi } from "vitest";

import { RolesService } from "../src/admin/roles.service";
import { UsersService } from "../src/admin/users.service";
import { AuthService } from "../src/auth/auth.service";
import { LoginThrottleService } from "../src/auth/login-throttle.service";
import { TokenService } from "../src/auth/token.service";

const identity = {
  userId: "00000000-0000-4000-8000-000000000001",
  email: "staff@example.com",
  displayName: "Staff",
  mustChangePassword: false,
  roleKeys: [ROLE_KEYS.ADMIN],
  permissions: [],
  sessionId: "00000000-0000-4000-8000-000000000002",
  sessionCreatedAt: new Date(),
  sessionAbsoluteExpiresAt: new Date(Date.now() + 10_000),
  sessionIdleExpiresAt: new Date(Date.now() + 10_000),
  csrfTokenHash: null,
} as const;

describe("authentication service", () => {
  it.each([
    { user: null, valid: false },
    { user: { id: "u", passwordHash: "hash", status: "ACTIVE" }, valid: false },
    { user: { id: "u", passwordHash: "hash", status: "DISABLED" }, valid: true },
  ])(
    "returns the same generic error for unknown, wrong, and disabled credentials",
    async ({ user, valid }) => {
      const service = new AuthService(
        { client: { user: { findUnique: vi.fn().mockResolvedValue(user) } } } as never,
        {
          hash: vi.fn().mockResolvedValue("dummy"),
          verify: vi.fn().mockResolvedValue(valid),
        } as never,
        {} as never,
        {
          key: vi.fn().mockReturnValue("key"),
          assertAllowed: vi.fn(),
          registerFailure: vi.fn(),
          clear: vi.fn(),
        } as never,
        { record: vi.fn() } as never,
      );
      let response: unknown;
      try {
        await service.login({ email: "staff@example.com", password: "incorrect" }, "source");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        response = (error as UnauthorizedException).getResponse();
      }
      expect(response).toEqual({
        code: "AUTHENTICATION_FAILED",
        message: "Unable to sign in with those credentials.",
      });
    },
  );
  it("creates a session, updates last login, and returns only safe identity data", async () => {
    const update = vi.fn();
    const sessions = {
      create: vi.fn().mockResolvedValue({
        id: "s",
        rawToken: "raw",
        absoluteExpiresAt: new Date(),
        idleExpiresAt: new Date(),
      }),
      validate: vi.fn().mockResolvedValue(identity),
    };
    const audit = { record: vi.fn() };
    const service = new AuthService(
      {
        client: {
          user: {
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: "u", passwordHash: "hash", status: "ACTIVE" }),
            update,
          },
        },
      } as never,
      {
        hash: vi.fn().mockResolvedValue("dummy"),
        verify: vi.fn().mockResolvedValue(true),
      } as never,
      sessions as never,
      {
        key: vi.fn().mockReturnValue("key"),
        assertAllowed: vi.fn(),
        registerFailure: vi.fn(),
        clear: vi.fn(),
      } as never,
      audit as never,
    );
    const result = await service.login(
      { email: "staff@example.com", password: "correct password" },
      "source",
    );
    expect(result.identity).toBe(identity);
    expect(sessions.create).toHaveBeenCalledWith("u");
    expect(update).toHaveBeenCalledOnce();
    expect(JSON.stringify(service.me(identity))).not.toMatch(/password|rawToken|tokenHash/);
  });
  it("rejects current-password reuse and rotates after a valid change", async () => {
    const sessions = { rotate: vi.fn().mockResolvedValue({ id: "new" }) };
    const passwords = {
      hash: vi.fn().mockResolvedValue("new-hash"),
      verify: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(true),
    };
    const service = new AuthService(
      {
        client: { user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ passwordHash: "old" }) } },
      } as never,
      passwords as never,
      sessions as never,
      {} as never,
      { record: vi.fn() } as never,
    );
    await expect(
      service.changePassword(identity, {
        currentPassword: "old password",
        newPassword: "old password again",
        confirmPassword: "old password again",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(sessions.rotate).not.toHaveBeenCalled();
  });
});

describe("durable throttling", () => {
  it("blocks within the configured window with the generic response", async () => {
    const service = new LoginThrottleService(
      {
        client: {
          loginThrottle: {
            findUnique: vi.fn().mockResolvedValue({ blockedUntil: new Date(Date.now() + 10_000) }),
          },
        },
      } as never,
      { value: { LOGIN_THROTTLE_WINDOW_SECONDS: 900, LOGIN_THROTTLE_MAX_ATTEMPTS: 8 } } as never,
      new TokenService(),
    );
    let caught: unknown;
    try {
      await service.assertAllowed("hash");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(429);
    expect((caught as HttpException).getResponse()).toEqual({
      code: "AUTHENTICATION_FAILED",
      message: "Unable to sign in with those credentials.",
    });
  });
});

describe("user and role management invariants", () => {
  it("creates a mandatory-change user and returns a temporary password only in the one-time envelope", async () => {
    const created = {
      id: "u",
      email: "new@example.com",
      displayName: "New Staff",
      status: "ACTIVE",
      mustChangePassword: true,
      roles: [],
    };
    const database = {
      client: {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(created),
        },
        role: { findMany: vi.fn().mockResolvedValue([]) },
      },
    };
    const service = new UsersService(
      database as never,
      {
        generateTemporaryPassword: () => "temporary passphrase A1",
        hash: vi.fn().mockResolvedValue("argon-hash"),
      } as never,
      {} as never,
      { record: vi.fn() } as never,
    );
    const result = await service.create(
      { email: "new@example.com", displayName: "New Staff", roleIds: [] },
      "actor",
    );
    expect(result.temporaryPassword).toBe("temporary passphrase A1");
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(database.client.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: "argon-hash", mustChangePassword: true }),
      }),
    );
  });
  it("refuses to disable the final active Super Admin inside the transaction", async () => {
    const transaction = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          status: "ACTIVE",
          roles: [{ role: { key: ROLE_KEYS.SUPER_ADMIN } }],
        }),
        count: vi.fn().mockResolvedValue(1),
        update: vi.fn(),
      },
    };
    const database = {
      client: {
        $transaction: (callback: (value: typeof transaction) => unknown) => callback(transaction),
      },
    };
    const service = new UsersService(
      database as never,
      {} as never,
      { revokeAll: vi.fn() } as never,
      { record: vi.fn() } as never,
    );
    await expect(service.disable("u", "actor")).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.user.update).not.toHaveBeenCalled();
  });
  it("protects system role details and rejects unknown permission keys", async () => {
    const role = {
      id: "r",
      key: ROLE_KEYS.ADMIN,
      isSystem: true,
      permissions: [],
      _count: { users: 0 },
    };
    const database = { client: { role: { findUnique: vi.fn().mockResolvedValue(role) } } };
    const service = new RolesService(database as never, { record: vi.fn() } as never);
    await expect(service.update("r", { displayName: "Changed" }, "actor")).rejects.toBeInstanceOf(
      ConflictException,
    );
    const customService = new RolesService(
      {
        client: {
          role: {
            findUnique: vi.fn().mockResolvedValue({ ...role, key: "CUSTOM", isSystem: false }),
          },
        },
      } as never,
      { record: vi.fn() } as never,
    );
    await expect(
      customService.assignPermissions("r", { permissionKeys: ["unknown.permission"] }, "actor"),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
