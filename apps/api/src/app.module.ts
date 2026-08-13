import { Module } from "@nestjs/common";

import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./admin/admin.module";
import { BeforeAfterModule } from "./before-after/before-after.module";
import { QuoteRequestsModule } from "./quote-requests/quote-requests.module";
import { EstimatorModule } from "./estimator/estimator.module";
import { BlogModule } from "./blog/blog.module";
import { JobsModule } from "./jobs/jobs.module";
import { MarketingModule } from "./marketing/marketing.module";
import { SeoModule } from "./seo/seo.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AdminModule,
    BeforeAfterModule,
    QuoteRequestsModule,
    EstimatorModule,
    BlogModule,
    JobsModule,
    MarketingModule,
    SeoModule,
    HealthModule,
  ],
})
export class AppModule {}
