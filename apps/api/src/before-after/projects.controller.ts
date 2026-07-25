import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  beforeAfterMediaOrderSchema,
  beforeAfterProjectListQuerySchema,
  beforeAfterSlugSchema,
  createBeforeAfterProjectSchema,
  identifierSchema,
  publicBeforeAfterProjectListQuerySchema,
  updateBeforeAfterProjectSchema,
  type BeforeAfterMediaOrderInput,
  type CreateBeforeAfterProjectInput,
  type UpdateBeforeAfterProjectInput,
} from "@ctps/validation";

import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { BeforeAfterProjectsService } from "./projects.service";

@Controller()
export class BeforeAfterProjectsController {
  constructor(
    @Inject(BeforeAfterProjectsService) private readonly projects: BeforeAfterProjectsService,
  ) {}
  @Get("admin/before-after-projects")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_READ)
  list(
    @Query(new ZodValidationPipe(beforeAfterProjectListQuerySchema))
    query: {
      page: number;
      pageSize: number;
      search?: string;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      serviceKey?: string;
      serviceAreaKey?: string;
      featured?: boolean;
    },
  ) {
    return this.projects.list(query);
  }
  @Get("admin/before-after-projects/:id")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_READ)
  get(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.projects.get(id);
  }
  @Post("admin/before-after-projects")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_CREATE)
  create(
    @Body(new ZodValidationPipe(createBeforeAfterProjectSchema))
    input: CreateBeforeAfterProjectInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.create(input, actor.userId);
  }
  @Patch("admin/before-after-projects/:id")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_UPDATE)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(updateBeforeAfterProjectSchema))
    input: UpdateBeforeAfterProjectInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.update(id, input, actor.userId);
  }
  @Put("admin/before-after-projects/:id/media-order")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_UPDATE)
  reorder(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(beforeAfterMediaOrderSchema)) input: BeforeAfterMediaOrderInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.reorder(id, input, actor.userId);
  }
  @Post("admin/before-after-projects/:id/publish")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_PUBLISH)
  publish(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.publish(id, actor.userId);
  }
  @Post("admin/before-after-projects/:id/unpublish")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_PUBLISH)
  unpublish(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.unpublish(id, actor.userId);
  }
  @Post("admin/before-after-projects/:id/archive")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_ARCHIVE)
  archive(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.archive(id, actor.userId);
  }
  @Delete("admin/before-after-projects/:id")
  @RequirePermissions(PERMISSION_KEYS.PROJECTS_BEFORE_AFTER_DELETE)
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.projects.remove(id, actor.userId);
  }

  @Get("public/before-after-projects")
  @PublicRoute()
  publicList(
    @Query(new ZodValidationPipe(publicBeforeAfterProjectListQuerySchema))
    query: {
      page: number;
      pageSize: number;
      serviceKey?: string;
      serviceAreaKey?: string;
      featured?: boolean;
    },
  ) {
    return this.projects.publicList(query);
  }
  @Get("public/before-after-projects/:slug")
  @PublicRoute()
  publicGet(@Param("slug", new ZodValidationPipe(beforeAfterSlugSchema)) slug: string) {
    return this.projects.publicGet(slug);
  }
}
