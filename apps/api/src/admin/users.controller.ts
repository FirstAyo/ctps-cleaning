import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  assignRolesSchema,
  createUserSchema,
  identifierSchema,
  updateUserSchema,
  userListQuerySchema,
  type AssignRolesInput,
  type CreateUserInput,
  type UpdateUserInput,
} from "@ctps/validation";

import { ZodValidationPipe } from "../common/zod-validation.pipe";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, RequirePermissions } from "../auth/security.decorators";
import { UsersService } from "./users.service";

@Controller("admin/users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSION_KEYS.USERS_READ)
  list(
    @Query(new ZodValidationPipe(userListQuerySchema))
    query: {
      page: number;
      pageSize: number;
      search?: string;
      status?: "ACTIVE" | "DISABLED";
    },
  ) {
    return this.users.list(query);
  }

  @Get(":id")
  @RequirePermissions(PERMISSION_KEYS.USERS_READ)
  get(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.users.get(id);
  }

  @Post()
  @RequirePermissions(PERMISSION_KEYS.USERS_CREATE, PERMISSION_KEYS.USERS_ASSIGN_ROLES)
  create(
    @Body(new ZodValidationPipe(createUserSchema)) input: CreateUserInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.users.create(input, actor.userId);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSION_KEYS.USERS_UPDATE)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) input: UpdateUserInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.users.update(id, input, actor.userId);
  }

  @Put(":id/roles")
  @RequirePermissions(PERMISSION_KEYS.USERS_ASSIGN_ROLES)
  assignRoles(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(assignRolesSchema)) input: AssignRolesInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.users.assignRoles(id, input, actor.userId);
  }

  @Post(":id/disable")
  @RequirePermissions(PERMISSION_KEYS.USERS_DISABLE)
  disable(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.users.disable(id, actor.userId);
  }

  @Post(":id/reactivate")
  @RequirePermissions(PERMISSION_KEYS.USERS_DISABLE)
  reactivate(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.users.reactivate(id, actor.userId);
  }

  @Post(":id/reset-password")
  @RequirePermissions(PERMISSION_KEYS.USERS_UPDATE)
  resetPassword(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.users.resetPassword(id, actor.userId);
  }
}
