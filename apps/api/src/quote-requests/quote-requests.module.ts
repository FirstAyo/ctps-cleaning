import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { QuoteConfigService } from "./quote-config.service";
import { QuoteEmailService } from "./quote-email.service";
import { QuoteMediaService } from "./quote-media.service";
import { QuoteRequestsController } from "./quote-requests.controller";
import { QuoteRequestsService } from "./quote-requests.service";
import { QuoteSecurityService } from "./quote-security.service";
import { QuoteCleanupService } from "./quote-cleanup.service";
import { QuoteReferenceService } from "./quote-reference.service";
import { GeneralInquiriesController } from "./general-inquiries.controller";
import { GeneralInquiriesService } from "./general-inquiries.service";
import { GeneralInquiryEmailService } from "./general-inquiry-email.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [QuoteRequestsController, GeneralInquiriesController],
  providers: [
    QuoteConfigService,
    QuoteSecurityService,
    QuoteEmailService,
    QuoteMediaService,
    QuoteRequestsService,
    QuoteCleanupService,
    QuoteReferenceService,
    GeneralInquiriesService,
    GeneralInquiryEmailService,
  ],
  exports: [QuoteEmailService, GeneralInquiryEmailService],
})
export class QuoteRequestsModule {}
