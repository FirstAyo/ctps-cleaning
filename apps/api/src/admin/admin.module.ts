import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditLogsService } from "./audit-logs.service";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UsersController, RolesController, AuditLogsController],
  providers: [UsersService, RolesService, AuditLogsService],
})
export class AdminModule {}
