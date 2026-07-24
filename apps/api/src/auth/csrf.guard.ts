import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedRequest } from "./auth.types";
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from "./security.decorators";
import { TokenService } from "./token.service";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      safeMethods.has(request.method) ||
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    if (
      !request.auth &&
      this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const token = request.header("x-csrf-token");
    const expected = request.auth?.csrfTokenHash;
    if (!token || !expected || !this.tokens.safelyMatches(token, expected)) {
      throw new ForbiddenException({
        code: "CSRF_VALIDATION_FAILED",
        message: "The security token is missing or invalid. Refresh and try again.",
      });
    }
    return true;
  }
}
