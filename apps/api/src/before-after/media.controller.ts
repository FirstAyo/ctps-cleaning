import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  beforeAfterMediaUpdateSchema,
  identifierSchema,
  type BeforeAfterMediaUpdateInput,
} from "@ctps/validation";

import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { BeforeAfterMediaService } from "./media.service";

function applyFileHeaders(
  response: Response,
  file: { mimeType: string; sizeBytes: number; cacheControl: string; filename: string },
) {
  response.setHeader("Content-Type", file.mimeType);
  response.setHeader("Content-Length", String(file.sizeBytes));
  response.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", file.cacheControl);
}

@Controller()
export class BeforeAfterMediaController {
  constructor(@Inject(BeforeAfterMediaService) private readonly media: BeforeAfterMediaService) {}

  @Post("admin/media/before-after")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_BEFORE_AFTER_UPLOAD)
  @UseInterceptors(
    FilesInterceptor("files", 10, { limits: { files: 10, fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.media.upload(files ?? [], actor.userId);
  }

  @Patch("admin/media/before-after/:id")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_BEFORE_AFTER_UPDATE)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(beforeAfterMediaUpdateSchema)) input: BeforeAfterMediaUpdateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.media.update(id, input, actor.userId);
  }

  @Delete("admin/media/before-after/:id")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_BEFORE_AFTER_DELETE)
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.media.remove(id, actor.userId);
  }

  @Get("admin/media/before-after/:id/:variant")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_BEFORE_AFTER_READ)
  async privateFile(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("variant") variant: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.file(id, variant, false);
    applyFileHeaders(response, file);
    return new StreamableFile(file.data);
  }

  @Get("media/before-after/:id/:variant")
  @PublicRoute()
  async publicFile(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("variant") variant: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.file(id, variant, true);
    applyFileHeaders(response, file);
    return new StreamableFile(file.data);
  }
}
