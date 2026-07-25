import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { BeforeAfterMediaController } from "./media.controller";
import { BeforeAfterMediaService } from "./media.service";
import { BeforeAfterProjectsController } from "./projects.controller";
import { BeforeAfterProjectsService } from "./projects.service";
import { ImageProcessingService } from "./image-processing.service";
import { LocalMediaStorageService } from "./local-media-storage.service";
import { MediaConfigService } from "./media-config.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BeforeAfterMediaController, BeforeAfterProjectsController],
  providers: [
    MediaConfigService,
    LocalMediaStorageService,
    ImageProcessingService,
    BeforeAfterMediaService,
    BeforeAfterProjectsService,
  ],
})
export class BeforeAfterModule {}
