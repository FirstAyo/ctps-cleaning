import { SetMetadata, createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { PermissionKey } from "@ctps/permissions";

import type { AuthenticatedRequest } from "./auth.types";

export const IS_PUBLIC_KEY = "ctps:isPublic";
export const IS_OPTIONAL_AUTH_KEY = "ctps:isOptionalAuth";
export const REQUIRED_PERMISSIONS_KEY = "ctps:requiredPermissions";

export const PublicRoute = () => SetMetadata(IS_PUBLIC_KEY, true);
export const OptionalAuthentication = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
