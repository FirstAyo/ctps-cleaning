import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { MarketingController } from "./marketing.controller";
import { MarketingMediaController } from "./marketing-media.controller";
import { MarketingMediaService } from "./marketing-media.service";
import { MarketingService } from "./marketing.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [MarketingController, MarketingMediaController],
  providers: [MarketingService, MarketingMediaService],
  exports: [MarketingService],
})
export class MarketingModule {}
