import { Module } from "@nestjs/common";

import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [DatabaseModule, AuthModule, AdminModule, HealthModule],
})
export class AppModule {}
