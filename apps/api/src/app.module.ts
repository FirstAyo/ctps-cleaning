import { Module } from "@nestjs/common";

import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./admin/admin.module";
import { BeforeAfterModule } from "./before-after/before-after.module";

@Module({
  imports: [DatabaseModule, AuthModule, AdminModule, BeforeAfterModule, HealthModule],
})
export class AppModule {}
