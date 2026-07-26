import {
  Body,
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
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  convertQuoteToServiceJobSchema,
  createInternalServiceJobSchema,
  identifierSchema,
  serviceJobAssignmentSchema,
  serviceJobCalendarQuerySchema,
  serviceJobCancellationSchema,
  serviceJobChecklistItemSchema,
  serviceJobChecklistUpdateSchema,
  serviceJobCompletionSchema,
  serviceJobIncidentSchema,
  serviceJobIncidentUpdateSchema,
  serviceJobListQuerySchema,
  serviceJobMediaMetadataSchema,
  serviceJobMediaUpdateSchema,
  serviceJobNoteSchema,
  serviceJobNoteUpdateSchema,
  serviceJobNotificationSchema,
  serviceJobScheduleSchema,
  serviceJobStatusTransitionSchema,
  updateServiceJobSchema,
  type ConvertQuoteToServiceJobInput,
  type CreateInternalServiceJobInput,
  type ServiceJobAssignmentInput,
  type ServiceJobCalendarQuery,
  type ServiceJobCancellationInput,
  type ServiceJobChecklistItemInput,
  type ServiceJobChecklistUpdateInput,
  type ServiceJobCompletionInput,
  type ServiceJobIncidentInput,
  type ServiceJobIncidentUpdateInput,
  type ServiceJobListQuery,
  type ServiceJobMediaMetadataInput,
  type ServiceJobMediaUpdateInput,
  type ServiceJobNoteInput,
  type ServiceJobNoteUpdateInput,
  type ServiceJobNotificationInput,
  type ServiceJobScheduleInput,
  type ServiceJobStatusTransitionInput,
  type UpdateServiceJobInput,
} from "@ctps/validation";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JobMediaService } from "./job-media.service";
import { JobNotificationService } from "./job-notification.service";
import { JobsService } from "./jobs.service";

@Controller("admin/jobs")
export class JobsController {
  constructor(
    @Inject(JobsService) private readonly jobs: JobsService,
    @Inject(JobNotificationService) private readonly notifications: JobNotificationService,
  ) {}
  @Get() list(
    @Query(new ZodValidationPipe(serviceJobListQuerySchema)) query: ServiceJobListQuery,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.list(query, identity);
  }
  @Get("calendar") calendar(
    @Query(new ZodValidationPipe(serviceJobCalendarQuerySchema)) query: ServiceJobCalendarQuery,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.calendar(query, identity);
  }
  @Get("staff") @RequirePermissions(PERMISSION_KEYS.JOBS_ASSIGN) staff() {
    return this.jobs.staff();
  }
  @Get("eligible-quotes")
  @RequirePermissions(PERMISSION_KEYS.JOBS_CREATE_FROM_QUOTE)
  eligibleQuotes() {
    return this.jobs.eligibleQuotes();
  }
  @Get(":id") get(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.get(id, identity);
  }
  @Post() @RequirePermissions(PERMISSION_KEYS.JOBS_CREATE_INTERNAL) create(
    @Body(new ZodValidationPipe(createInternalServiceJobSchema))
    input: CreateInternalServiceJobInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.createInternal(input, identity);
  }
  @Post("from-quote/:quoteRequestId")
  @RequirePermissions(PERMISSION_KEYS.JOBS_CREATE_FROM_QUOTE)
  convert(
    @Param("quoteRequestId", new ZodValidationPipe(identifierSchema)) quoteRequestId: string,
    @Body(new ZodValidationPipe(convertQuoteToServiceJobSchema))
    input: ConvertQuoteToServiceJobInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.convertQuote(quoteRequestId, input, identity);
  }
  @Patch(":id") @RequirePermissions(PERMISSION_KEYS.JOBS_UPDATE) update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(updateServiceJobSchema)) input: UpdateServiceJobInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.update(id, input, identity);
  }
  @Post(":id/schedule") schedule(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobScheduleSchema)) input: ServiceJobScheduleInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.schedule(id, input, identity);
  }
  @Post(":id/assignments") @RequirePermissions(PERMISSION_KEYS.JOBS_ASSIGN) assign(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobAssignmentSchema)) input: ServiceJobAssignmentInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.assign(id, input, identity);
  }
  @Delete(":id/assignments/:assignmentId")
  @RequirePermissions(PERMISSION_KEYS.JOBS_ASSIGN)
  unassign(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("assignmentId", new ZodValidationPipe(identifierSchema)) assignmentId: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.unassign(id, assignmentId, identity);
  }
  @Post(":id/status") changeStatus(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobStatusTransitionSchema))
    input: ServiceJobStatusTransitionInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.changeStatus(id, input, identity);
  }
  @Post(":id/complete") @RequirePermissions(PERMISSION_KEYS.JOBS_COMPLETE) complete(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobCompletionSchema)) input: ServiceJobCompletionInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.complete(id, input, identity);
  }
  @Post(":id/cancel") @RequirePermissions(PERMISSION_KEYS.JOBS_CANCEL) cancel(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobCancellationSchema)) input: ServiceJobCancellationInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.cancel(id, input, identity);
  }
  @Post(":id/checklist") @RequirePermissions(PERMISSION_KEYS.JOBS_MANAGE_CHECKLIST) addChecklist(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobChecklistItemSchema)) input: ServiceJobChecklistItemInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.addChecklist(id, input, identity);
  }
  @Patch(":id/checklist/:itemId")
  @RequirePermissions(PERMISSION_KEYS.JOBS_MANAGE_CHECKLIST)
  updateChecklist(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("itemId", new ZodValidationPipe(identifierSchema)) itemId: string,
    @Body(new ZodValidationPipe(serviceJobChecklistUpdateSchema))
    input: ServiceJobChecklistUpdateInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.updateChecklist(id, itemId, input, identity);
  }
  @Post(":id/notes") addNote(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobNoteSchema)) input: ServiceJobNoteInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.addNote(id, input, identity);
  }
  @Patch(":id/notes/:noteId")
  updateNote(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("noteId", new ZodValidationPipe(identifierSchema)) noteId: string,
    @Body(new ZodValidationPipe(serviceJobNoteUpdateSchema)) input: ServiceJobNoteUpdateInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.updateNote(id, noteId, input, identity);
  }
  @Delete(":id/notes/:noteId")
  removeNote(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("noteId", new ZodValidationPipe(identifierSchema)) noteId: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.removeNote(id, noteId, identity);
  }
  @Post(":id/incidents") @RequirePermissions(PERMISSION_KEYS.JOBS_MANAGE_INCIDENTS) addIncident(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobIncidentSchema)) input: ServiceJobIncidentInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.addIncident(id, input, identity);
  }
  @Patch(":id/incidents/:incidentId")
  @RequirePermissions(PERMISSION_KEYS.JOBS_MANAGE_INCIDENTS)
  updateIncident(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("incidentId", new ZodValidationPipe(identifierSchema)) incidentId: string,
    @Body(new ZodValidationPipe(serviceJobIncidentUpdateSchema))
    input: ServiceJobIncidentUpdateInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.updateIncident(id, incidentId, input, identity);
  }
  @Post(":id/notifications")
  @RequirePermissions(PERMISSION_KEYS.JOBS_MANAGE_CUSTOMER_NOTIFICATIONS)
  notify(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(serviceJobNotificationSchema)) input: ServiceJobNotificationInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.notifications.queue(id, input, identity);
  }
  @Delete(":id") @RequirePermissions(PERMISSION_KEYS.JOBS_DELETE) remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.jobs.remove(id, identity);
  }
}

@Controller("admin/jobs")
export class JobMediaController {
  constructor(@Inject(JobMediaService) private readonly media: JobMediaService) {}
  @Post(":id/media")
  @RequirePermissions(PERMISSION_KEYS.JOBS_UPLOAD_PRIVATE_MEDIA)
  @UseInterceptors(
    FilesInterceptor("files", 10, { limits: { files: 10, fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(serviceJobMediaMetadataSchema)) input: ServiceJobMediaMetadataInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.upload(id, files ?? [], input, identity);
  }
  @Patch(":id/media/:mediaId")
  @RequirePermissions(PERMISSION_KEYS.JOBS_UPLOAD_PRIVATE_MEDIA)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("mediaId", new ZodValidationPipe(identifierSchema)) mediaId: string,
    @Body(new ZodValidationPipe(serviceJobMediaUpdateSchema)) input: ServiceJobMediaUpdateInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.update(id, mediaId, input, identity);
  }
  @Get(":id/media/:mediaId/:variant")
  @RequirePermissions(PERMISSION_KEYS.JOBS_READ_PRIVATE_MEDIA)
  async file(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("mediaId", new ZodValidationPipe(identifierSchema)) mediaId: string,
    @Param("variant") variant: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.file(id, mediaId, variant, identity);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Length", String(file.sizeBytes));
    response.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
    return new StreamableFile(file.data);
  }
  @Delete(":id/media/:mediaId")
  @RequirePermissions(PERMISSION_KEYS.JOBS_DELETE_PRIVATE_MEDIA)
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("mediaId", new ZodValidationPipe(identifierSchema)) mediaId: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.remove(id, mediaId, identity);
  }
}
