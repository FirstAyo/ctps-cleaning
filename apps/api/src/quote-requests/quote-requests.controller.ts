import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  identifierSchema,
  quoteArchiveSchema,
  quoteAssignmentSchema,
  quoteDraftCreateSchema,
  quoteInternalNoteSchema,
  quoteListQuerySchema,
  quoteStatusUpdateSchema,
  quoteSubmissionSchema,
  quoteUploadOrderSchema,
  type QuoteAssignmentInput,
  type QuoteInternalNoteInput,
  type QuoteListQuery,
  type QuoteStatusUpdateInput,
  type QuoteSubmissionInput,
} from "@ctps/validation";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { QuoteMediaService } from "./quote-media.service";
import { QuoteRequestsService } from "./quote-requests.service";
import { QuoteSecurityService } from "./quote-security.service";

@Controller()
export class QuoteRequestsController {
  constructor(
    @Inject(QuoteRequestsService) private readonly quotes: QuoteRequestsService,
    @Inject(QuoteMediaService) private readonly media: QuoteMediaService,
    @Inject(QuoteSecurityService) private readonly security: QuoteSecurityService,
  ) {}
  @Post("public/quote-requests/drafts")
  @PublicRoute()
  createDraft(
    @Body(new ZodValidationPipe(quoteDraftCreateSchema)) _body: unknown,
    @Req() request: Request,
  ) {
    return this.quotes.createDraft(request);
  }
  @Post("public/quote-requests/uploads")
  @PublicRoute()
  @UseInterceptors(
    FilesInterceptor("files", 20, { limits: { files: 20, fileSize: 25 * 1024 * 1024 } }),
  )
  async upload(
    @Headers("x-quote-draft-token") token: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: Request,
  ) {
    this.security.assertTrustedBrowser(request);
    await this.security.throttle(request, "quote-upload");
    return this.media.upload(token ?? "", files ?? []);
  }
  @Delete("public/quote-requests/uploads/:id")
  @PublicRoute()
  async removeUpload(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Headers("x-quote-draft-token") token: string,
    @Req() request: Request,
  ) {
    this.security.assertTrustedBrowser(request);
    await this.security.throttle(request, "quote-upload-mutation");
    return this.media.remove(token ?? "", id);
  }
  @Put("public/quote-requests/uploads/order")
  @PublicRoute()
  async reorderUploads(
    @Headers("x-quote-draft-token") token: string,
    @Body(new ZodValidationPipe(quoteUploadOrderSchema)) body: { uploadIds: string[] },
    @Req() request: Request,
  ) {
    this.security.assertTrustedBrowser(request);
    await this.security.throttle(request, "quote-upload-mutation");
    return this.media.reorder(token ?? "", body.uploadIds);
  }
  @Post("public/quote-requests")
  @PublicRoute()
  submit(
    @Body(new ZodValidationPipe(quoteSubmissionSchema)) body: QuoteSubmissionInput,
    @Req() request: Request,
  ) {
    return this.quotes.submit(body, request);
  }
  @Get("public/quote-requests/confirmation/:token")
  @PublicRoute()
  confirmation(@Param("token") token: string) {
    return this.quotes.confirmation(token);
  }

  @Get("admin/quote-requests")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_READ)
  list(@Query(new ZodValidationPipe(quoteListQuerySchema)) query: QuoteListQuery) {
    return this.quotes.list(query);
  }
  @Get("admin/quote-requests-assignees")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_ASSIGN)
  assignees() {
    return this.quotes.assignees();
  }
  @Get("admin/quote-requests/:id")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_READ)
  get(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.quotes.get(id);
  }
  @Post("admin/quote-requests/:id/status")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_CHANGE_STATUS)
  status(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(quoteStatusUpdateSchema)) body: QuoteStatusUpdateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.quotes.status(id, body, actor.userId);
  }
  @Put("admin/quote-requests/:id/assignment")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_ASSIGN)
  assign(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(quoteAssignmentSchema)) body: QuoteAssignmentInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.quotes.assign(id, body, actor.userId);
  }
  @Post("admin/quote-requests/:id/notes")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_ADD_INTERNAL_NOTES)
  note(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(quoteInternalNoteSchema)) body: QuoteInternalNoteInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.quotes.note(id, body, actor.userId);
  }
  @Post("admin/quote-requests/:id/archive")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_ARCHIVE)
  archive(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(quoteArchiveSchema)) body: { archive: boolean },
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.quotes.archive(id, body.archive, actor.userId);
  }
  @Delete("admin/quote-requests/:id")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_DELETE)
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.quotes.remove(id, actor.userId);
  }
  @Get("admin/quote-requests/:id/uploads/:uploadId")
  @RequirePermissions(PERMISSION_KEYS.QUOTE_REQUESTS_READ_PRIVATE_MEDIA)
  async privateFile(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("uploadId", new ZodValidationPipe(identifierSchema)) uploadId: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.fileForAdmin(id, uploadId, actor.userId);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Length", String(file.sizeBytes));
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${file.filename.replaceAll('"', "")}"`,
    );
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    return new StreamableFile(file.data);
  }
}
