import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasEveryPermission, type PermissionKey } from "@ctps/permissions";

import type { AuthenticatedRequest } from "./auth.types";
import { REQUIRED_PERMISSIONS_KEY } from "./security.decorators";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly PermissionKey[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;
    const identity = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
    if (!identity || !hasEveryPermission(identity.permissions, required)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      });
    }
    return true;
  }
}
