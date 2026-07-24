import { Body, Controller, Get, Inject, Param, Patch, Post, Put } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  assignPermissionsSchema,
  createRoleSchema,
  identifierSchema,
  updateRoleSchema,
  type AssignPermissionsInput,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "@ctps/validation";

import { ZodValidationPipe } from "../common/zod-validation.pipe";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, RequirePermissions } from "../auth/security.decorators";
import { RolesService } from "./roles.service";

@Controller("admin")
export class RolesController {
  constructor(@Inject(RolesService) private readonly roles: RolesService) {}

  @Get("roles")
  @RequirePermissions(PERMISSION_KEYS.ROLES_READ)
  list() {
    return this.roles.list();
  }

  @Get("roles/:id")
  @RequirePermissions(PERMISSION_KEYS.ROLES_READ)
  get(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.roles.get(id);
  }

  @Post("roles")
  @RequirePermissions(PERMISSION_KEYS.ROLES_CREATE)
  create(
    @Body(new ZodValidationPipe(createRoleSchema)) input: CreateRoleInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.roles.create(input, actor.userId);
  }

  @Patch("roles/:id")
  @RequirePermissions(PERMISSION_KEYS.ROLES_UPDATE)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) input: UpdateRoleInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.roles.update(id, input, actor.userId);
  }

  @Put("roles/:id/permissions")
  @RequirePermissions(PERMISSION_KEYS.ROLES_ASSIGN_PERMISSIONS)
  assign(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(assignPermissionsSchema)) input: AssignPermissionsInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.roles.assignPermissions(id, input, actor.userId);
  }

  @Get("permissions")
  @RequirePermissions(PERMISSION_KEYS.ROLES_READ)
  permissions() {
    return this.roles.listPermissions();
  }
}
