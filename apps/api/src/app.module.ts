import { Module } from "@nestjs/common";

import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./admin/admin.module";
import { BeforeAfterModule } from "./before-after/before-after.module";
import { QuoteRequestsModule } from "./quote-requests/quote-requests.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AdminModule,
    BeforeAfterModule,
    QuoteRequestsModule,
    HealthModule,
  ],
})
export class AppModule {}
