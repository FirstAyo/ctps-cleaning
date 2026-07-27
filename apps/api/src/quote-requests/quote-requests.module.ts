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

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [QuoteRequestsController],
  providers: [
    QuoteConfigService,
    QuoteSecurityService,
    QuoteEmailService,
    QuoteMediaService,
    QuoteRequestsService,
    QuoteCleanupService,
    QuoteReferenceService,
  ],
  exports: [QuoteEmailService],
})
export class QuoteRequestsModule {}
