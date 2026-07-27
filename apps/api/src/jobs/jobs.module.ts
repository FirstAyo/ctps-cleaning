import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { JobsController, JobMediaController } from "./jobs.controller";
import { JobsConfigService } from "./jobs-config.service";
import { JobImageService } from "./job-image.service";
import { JobMediaService } from "./job-media.service";
import { JobNotificationService } from "./job-notification.service";
import { JobReferenceService } from "./job-reference.service";
import { JobsService } from "./jobs.service";
import { JobStorageService } from "./job-storage.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [JobsController, JobMediaController],
  providers: [
    JobsConfigService,
    JobImageService,
    JobMediaService,
    JobNotificationService,
    JobReferenceService,
    JobsService,
    JobStorageService,
  ],
  exports: [JobsService, JobNotificationService],
})
export class JobsModule {}
