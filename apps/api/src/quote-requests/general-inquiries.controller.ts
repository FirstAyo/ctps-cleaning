import { Body, Controller, Get, Inject, Param, Post, Query, Req } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  generalInquiryArchiveSchema,
  generalInquiryListQuerySchema,
  generalInquiryReadSchema,
  generalInquirySubmissionSchema,
  identifierSchema,
  type GeneralInquiryListQuery,
  type GeneralInquirySubmissionInput,
} from "@ctps/validation";
import type { Request } from "express";

import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { GeneralInquiriesService } from "./general-inquiries.service";

@Controller()
export class GeneralInquiriesController {
  constructor(
    @Inject(GeneralInquiriesService) private readonly inquiries: GeneralInquiriesService,
  ) {}

  @Post("public/general-inquiries")
  @PublicRoute()
  submit(
    @Body(new ZodValidationPipe(generalInquirySubmissionSchema))
    body: GeneralInquirySubmissionInput,
    @Req() request: Request,
  ) {
    return this.inquiries.submit(body, request);
  }

  @Get("admin/general-inquiries")
  @RequirePermissions(PERMISSION_KEYS.GENERAL_INQUIRIES_READ)
  list(
    @Query(new ZodValidationPipe(generalInquiryListQuerySchema)) query: GeneralInquiryListQuery,
  ) {
    return this.inquiries.list(query);
  }

  @Get("admin/general-inquiries/:id")
  @RequirePermissions(PERMISSION_KEYS.GENERAL_INQUIRIES_READ)
  get(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.inquiries.get(id);
  }

  @Post("admin/general-inquiries/:id/read")
  @RequirePermissions(PERMISSION_KEYS.GENERAL_INQUIRIES_UPDATE)
  setRead(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(generalInquiryReadSchema)) body: { read: boolean },
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.inquiries.setRead(id, body.read, actor.userId);
  }

  @Post("admin/general-inquiries/:id/archive")
  @RequirePermissions(PERMISSION_KEYS.GENERAL_INQUIRIES_ARCHIVE)
  archive(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(generalInquiryArchiveSchema)) body: { archive: boolean },
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.inquiries.archive(id, body.archive, actor.userId);
  }
}
