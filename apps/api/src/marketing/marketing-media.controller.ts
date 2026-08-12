import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  identifierSchema,
  publicMediaListQuerySchema,
  publicMediaUpdateSchema,
  type PublicMediaListQuery,
  type PublicMediaUpdateInput,
} from "@ctps/validation";
import type { Response } from "express";

import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingMediaService } from "./marketing-media.service";

@Controller()
export class MarketingMediaController {
  constructor(@Inject(MarketingMediaService) private readonly media: MarketingMediaService) {}

  @Get("admin/media-library")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_READ)
  list(@Query(new ZodValidationPipe(publicMediaListQuerySchema)) query: PublicMediaListQuery) {
    return this.media.list(query);
  }

  @Get("admin/media-library/:id")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_READ)
  detail(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.media.detail(id);
  }

  @Get("admin/media-library/:id/usage")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_READ)
  usage(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.media.usage(id);
  }

  @Post("admin/media-library")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_UPLOAD)
  @UseInterceptors(
    FilesInterceptor("files", 10, { limits: { files: 10, fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.upload(files ?? [], identity);
  }

  @Patch("admin/media-library/:id")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_UPDATE)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(publicMediaUpdateSchema)) input: PublicMediaUpdateInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.update(id, input, identity);
  }

  @Post("admin/media-library/:id/archive")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_ARCHIVE)
  archive(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.archive(id, identity);
  }

  @Post("admin/media-library/:id/restore")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_RESTORE)
  restore(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.restore(id, identity);
  }

  @Delete("admin/media-library/:id")
  @RequirePermissions(PERMISSION_KEYS.MEDIA_LIBRARY_DELETE)
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.remove(id, identity);
  }

  @Get("media/marketing/:id/:kind")
  @PublicRoute()
  async file(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("kind") kind: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.file(id, kind);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Length", String(file.sizeBytes));
    response.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader("X-Content-Type-Options", "nosniff");
    return new StreamableFile(file.data);
  }
}
