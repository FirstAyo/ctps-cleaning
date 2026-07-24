import { Inject, Injectable } from "@nestjs/common";
import type { CookieOptions, Response } from "express";
import {
  ALL_PERMISSION_KEYS,
  combinePermissionKeys,
  isPermissionKey,
  ROLE_KEYS,
  type RoleKey,
} from "@ctps/permissions";

import { DatabaseService } from "../database/database.service";
import { AuthConfigService } from "./auth-config.service";
import type { AuthenticatedIdentity, CreatedSession } from "./auth.types";
import { TokenService } from "./token.service";

@Injectable()
export class SessionService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuthConfigService) private readonly config: AuthConfigService,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  get cookieName(): string {
    return this.config.value.AUTH_SESSION_COOKIE_NAME;
  }

  private cookieOptions(expires?: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.value.AUTH_COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      ...(this.config.value.AUTH_SESSION_COOKIE_DOMAIN
        ? { domain: this.config.value.AUTH_SESSION_COOKIE_DOMAIN }
        : {}),
      ...(expires ? { expires, maxAge: Math.max(0, expires.getTime() - Date.now()) } : {}),
    };
  }

  setCookie(response: Response, session: CreatedSession): void {
    response.cookie(
      this.cookieName,
      session.rawToken,
      this.cookieOptions(session.absoluteExpiresAt),
    );
  }

  clearCookie(response: Response): void {
    response.clearCookie(this.cookieName, this.cookieOptions(new Date(0)));
  }

  async create(userId: string): Promise<CreatedSession> {
    const rawToken = this.tokens.generateToken();
    const now = new Date();
    const absoluteExpiresAt = new Date(
      now.getTime() + this.config.value.AUTH_SESSION_ABSOLUTE_SECONDS * 1000,
    );
    const idleExpiresAt = new Date(
      Math.min(
        absoluteExpiresAt.getTime(),
        now.getTime() + this.config.value.AUTH_SESSION_IDLE_SECONDS * 1000,
      ),
    );
    const session = await this.database.client.session.create({
      data: {
        userId,
        tokenHash: this.tokens.hashToken(rawToken),
        absoluteExpiresAt,
        idleExpiresAt,
      },
      select: { id: true },
    });
    return { id: session.id, rawToken, absoluteExpiresAt, idleExpiresAt };
  }

  async validate(rawToken: string | undefined): Promise<AuthenticatedIdentity | null> {
    if (!rawToken) return null;
    const now = new Date();
    const session = await this.database.client.session.findUnique({
      where: { tokenHash: this.tokens.hashToken(rawToken) },
      include: {
        user: {
          include: {
            roles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });
    if (
      !session ||
      session.revokedAt ||
      session.absoluteExpiresAt <= now ||
      session.idleExpiresAt <= now ||
      session.user.status !== "ACTIVE"
    ) {
      if (session && !session.revokedAt) {
        await this.database.client.session.update({
          where: { id: session.id },
          data: { revokedAt: now, revocationReason: "expired-or-account-disabled" },
        });
      }
      return null;
    }

    const roleKeys = session.user.roles
      .map(({ role }) => role.key)
      .filter((key): key is RoleKey => Object.values(ROLE_KEYS).includes(key as RoleKey));
    const permissions = roleKeys.includes(ROLE_KEYS.SUPER_ADMIN)
      ? [...ALL_PERMISSION_KEYS]
      : combinePermissionKeys(
          session.user.roles.map(({ role }) =>
            role.permissions.map(({ permission }) => permission.key),
          ),
        );

    if (
      now.getTime() - session.lastActivityAt.getTime() >=
      this.config.value.AUTH_ACTIVITY_UPDATE_SECONDS * 1000
    ) {
      const idleExpiresAt = new Date(
        Math.min(
          session.absoluteExpiresAt.getTime(),
          now.getTime() + this.config.value.AUTH_SESSION_IDLE_SECONDS * 1000,
        ),
      );
      await this.database.client.session.update({
        where: { id: session.id },
        data: { lastActivityAt: now, idleExpiresAt },
      });
      session.lastActivityAt = now;
      session.idleExpiresAt = idleExpiresAt;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      mustChangePassword: session.user.mustChangePassword,
      roleKeys,
      permissions: permissions.filter(isPermissionKey),
      sessionId: session.id,
      sessionCreatedAt: session.createdAt,
      sessionAbsoluteExpiresAt: session.absoluteExpiresAt,
      sessionIdleExpiresAt: session.idleExpiresAt,
      csrfTokenHash: session.csrfTokenHash,
    };
  }

  async issueCsrf(sessionId: string): Promise<string> {
    const rawToken = this.tokens.generateToken();
    await this.database.client.session.update({
      where: { id: sessionId },
      data: { csrfTokenHash: this.tokens.hashToken(rawToken) },
    });
    return rawToken;
  }

  async revoke(sessionId: string, reason: string): Promise<void> {
    await this.database.client.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });
  }

  async revokeOthers(
    userId: string,
    currentSessionId: string,
    reason = "user-revoked-other-sessions",
  ): Promise<number> {
    const result = await this.database.client.session.updateMany({
      where: { userId, id: { not: currentSessionId }, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });
    return result.count;
  }

  async revokeOwned(userId: string, sessionId: string, currentSessionId: string): Promise<boolean> {
    if (sessionId === currentSessionId) return false;
    const result = await this.database.client.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: "user-revoked-session" },
    });
    return result.count === 1;
  }

  async revokeAll(userId: string, reason: string): Promise<number> {
    const result = await this.database.client.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: reason },
    });
    return result.count;
  }

  async rotate(userId: string, currentSessionId: string): Promise<CreatedSession> {
    await this.revokeAll(userId, "session-rotated");
    const created = await this.create(userId);
    if (created.id === currentSessionId) throw new Error("Session rotation failed");
    return created;
  }

  async listOwn(userId: string, currentSessionId: string) {
    const sessions = await this.database.client.session.findMany({
      where: {
        userId,
        revokedAt: null,
        absoluteExpiresAt: { gt: new Date() },
        idleExpiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        lastActivityAt: true,
        absoluteExpiresAt: true,
        idleExpiresAt: true,
      },
    });
    return sessions.map((session) => ({ ...session, current: session.id === currentSessionId }));
  }
}
