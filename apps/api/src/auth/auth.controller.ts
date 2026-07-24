import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  changePasswordSchema,
  identifierSchema,
  loginSchema,
  type ChangePasswordInput,
  type LoginInput,
} from "@ctps/validation";

import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuditService } from "./audit.service";
import { AuthService } from "./auth.service";
import type { AuthenticatedIdentity } from "./auth.types";
import { CurrentIdentity, OptionalAuthentication, PublicRoute } from "./security.decorators";
import { SessionService } from "./session.service";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @PublicRoute()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(input, request.ip || "unknown");
    this.sessions.setCookie(response, result.session);
    return { user: this.auth.me(result.identity) };
  }

  @Post("logout")
  @HttpCode(200)
  @OptionalAuthentication()
  async logout(
    @CurrentIdentity() identity: AuthenticatedIdentity | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (identity) await this.auth.logout(identity);
    this.sessions.clearCookie(response);
    return { success: true };
  }

  @Get("me")
  me(@CurrentIdentity() identity: AuthenticatedIdentity) {
    return { user: this.auth.me(identity) };
  }

  @Get("csrf")
  async csrf(@CurrentIdentity() identity: AuthenticatedIdentity) {
    return { csrfToken: await this.sessions.issueCsrf(identity.sessionId) };
  }

  @Post("change-password")
  async changePassword(
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Body(new ZodValidationPipe(changePasswordSchema)) input: ChangePasswordInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.changePassword(identity, input);
    this.sessions.setCookie(response, session);
    return { success: true };
  }

  @Get("sessions")
  async listSessions(@CurrentIdentity() identity: AuthenticatedIdentity) {
    return { items: await this.sessions.listOwn(identity.userId, identity.sessionId) };
  }

  @Delete("sessions/:sessionId")
  async revokeSession(
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Param("sessionId", new ZodValidationPipe(identifierSchema)) sessionId: string,
  ) {
    if (sessionId === identity.sessionId)
      throw new BadRequestException({
        code: "USE_LOGOUT_FOR_CURRENT_SESSION",
        message: "Use logout to revoke the current session.",
      });
    const revoked = await this.sessions.revokeOwned(identity.userId, sessionId, identity.sessionId);
    if (!revoked)
      throw new NotFoundException({
        code: "SESSION_NOT_FOUND",
        message: "The session was not found.",
      });
    await this.audit.record({
      actorUserId: identity.userId,
      action: "session.revoked",
      resourceType: "session",
      resourceId: sessionId,
    });
    return { success: true };
  }

  @Post("sessions/revoke-others")
  async revokeOthers(@CurrentIdentity() identity: AuthenticatedIdentity) {
    const revoked = await this.sessions.revokeOthers(identity.userId, identity.sessionId);
    await this.audit.record({
      actorUserId: identity.userId,
      action: "sessions.revoked-others",
      resourceType: "session",
      resourceId: identity.sessionId,
      metadata: { revokedCount: revoked },
    });
    return { success: true, revoked };
  }
}
