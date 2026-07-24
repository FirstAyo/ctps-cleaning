import type { Request } from "express";
import type { PermissionKey, RoleKey } from "@ctps/permissions";

export interface AuthenticatedIdentity {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly mustChangePassword: boolean;
  readonly roleKeys: readonly RoleKey[];
  readonly permissions: readonly PermissionKey[];
  readonly sessionId: string;
  readonly sessionCreatedAt: Date;
  readonly sessionAbsoluteExpiresAt: Date;
  readonly sessionIdleExpiresAt: Date;
  readonly csrfTokenHash: string | null;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedIdentity;
}

export interface CreatedSession {
  readonly id: string;
  readonly rawToken: string;
  readonly absoluteExpiresAt: Date;
  readonly idleExpiresAt: Date;
}
