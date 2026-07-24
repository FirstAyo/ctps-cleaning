import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { ChangePasswordInput, LoginInput } from "@ctps/validation";

import { DatabaseService } from "../database/database.service";
import { AuditService } from "./audit.service";
import type { AuthenticatedIdentity, CreatedSession } from "./auth.types";
import { LoginThrottleService } from "./login-throttle.service";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";

const genericFailure = {
  code: "AUTHENTICATION_FAILED",
  message: "Unable to sign in with those credentials.",
};

@Injectable()
export class AuthService {
  private readonly dummyHash: Promise<string>;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(LoginThrottleService) private readonly throttles: LoginThrottleService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {
    this.dummyHash = this.passwords.hash("CTPS invalid credential sentinel");
  }

  async login(
    input: LoginInput,
    source: string,
  ): Promise<{ identity: AuthenticatedIdentity; session: CreatedSession }> {
    const throttleKey = this.throttles.key(input.email, source);
    await this.throttles.assertAllowed(throttleKey);
    const user = await this.database.client.user.findUnique({ where: { email: input.email } });
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const validPassword = await this.passwords.verify(hash, input.password);
    if (!user || !validPassword || user.status !== "ACTIVE") {
      await this.throttles.registerFailure(throttleKey);
      await this.audit.record({
        action: "auth.login.failed",
        resourceType: "authentication",
        metadata: { outcome: "failed" },
      });
      throw new UnauthorizedException(genericFailure);
    }

    await this.throttles.clear(throttleKey);
    const session = await this.sessions.create(user.id);
    await this.database.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "auth.login.succeeded",
      resourceType: "session",
      resourceId: session.id,
      metadata: { outcome: "succeeded" },
    });
    const identity = await this.sessions.validate(session.rawToken);
    if (!identity) throw new UnauthorizedException(genericFailure);
    return { identity, session };
  }

  async logout(identity: AuthenticatedIdentity): Promise<void> {
    await this.sessions.revoke(identity.sessionId, "explicit-logout");
    await this.audit.record({
      actorUserId: identity.userId,
      action: "auth.logout",
      resourceType: "session",
      resourceId: identity.sessionId,
    });
  }

  async changePassword(
    identity: AuthenticatedIdentity,
    input: ChangePasswordInput,
  ): Promise<CreatedSession> {
    const user = await this.database.client.user.findUniqueOrThrow({
      where: { id: identity.userId },
    });
    if (!(await this.passwords.verify(user.passwordHash, input.currentPassword))) {
      throw new UnauthorizedException({
        code: "CURRENT_PASSWORD_INVALID",
        message: "The current password is incorrect.",
      });
    }
    if (await this.passwords.verify(user.passwordHash, input.newPassword)) {
      throw new ConflictException({
        code: "PASSWORD_REUSE",
        message: "Choose a password that differs from the current password.",
      });
    }
    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.database.client.user.update({
      where: { id: identity.userId },
      data: { passwordHash, mustChangePassword: false, passwordChangedAt: new Date() },
    });
    const session = await this.sessions.rotate(identity.userId, identity.sessionId);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "auth.password.changed",
      resourceType: "user",
      resourceId: identity.userId,
      metadata: { otherSessionsRevoked: true },
    });
    return session;
  }

  me(identity: AuthenticatedIdentity) {
    return {
      id: identity.userId,
      email: identity.email,
      displayName: identity.displayName,
      status: "ACTIVE" as const,
      mustChangePassword: identity.mustChangePassword,
      roleKeys: identity.roleKeys,
      permissions: identity.permissions,
      session: {
        id: identity.sessionId,
        createdAt: identity.sessionCreatedAt,
        absoluteExpiresAt: identity.sessionAbsoluteExpiresAt,
        idleExpiresAt: identity.sessionIdleExpiresAt,
      },
    };
  }
}
