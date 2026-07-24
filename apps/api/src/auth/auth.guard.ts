import { Inject, Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedRequest } from "./auth.types";
import { AuthConfigService } from "./auth-config.service";
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from "./security.decorators";
import { SessionService } from "./session.service";

const passwordChangeAllowedPaths = new Set([
  "/auth/me",
  "/auth/change-password",
  "/auth/csrf",
  "/auth/logout",
]);

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(AuthConfigService) private readonly config: AuthConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawToken = request.cookies?.[this.config.value.AUTH_SESSION_COOKIE_NAME] as
      string | undefined;
    const identity = await this.sessions.validate(rawToken);
    const optional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!identity && optional) return true;
    if (!identity)
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      });
    request.auth = identity;
    if (identity.mustChangePassword && !passwordChangeAllowedPaths.has(request.path)) {
      throw new ForbiddenException({
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "Change your password before continuing.",
      });
    }
    return true;
  }
}
