import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { BlogController, BlogMediaController } from "./blog.controller";
import { BlogConfigService } from "./blog-config.service";
import { BlogImageService } from "./blog-image.service";
import { BlogMediaService } from "./blog-media.service";
import { BlogService } from "./blog.service";
import { BlogStorageService } from "./blog-storage.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BlogController, BlogMediaController],
  providers: [
    BlogConfigService,
    BlogStorageService,
    BlogImageService,
    BlogMediaService,
    BlogService,
  ],
  exports: [BlogService],
})
export class BlogModule {}
