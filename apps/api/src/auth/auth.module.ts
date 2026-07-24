import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { DatabaseModule } from "../database/database.module";
import { AuditService } from "./audit.service";
import { AuthConfigService } from "./auth-config.service";
import { AuthController } from "./auth.controller";
import { AuthenticationGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CsrfGuard } from "./csrf.guard";
import { LoginThrottleService } from "./login-throttle.service";
import { PasswordService } from "./password.service";
import { PermissionGuard } from "./permission.guard";
import { SessionService } from "./session.service";
import { SessionCleanupService } from "./session-cleanup.service";
import { TokenService } from "./token.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuditService,
    AuthConfigService,
    AuthService,
    LoginThrottleService,
    PasswordService,
    SessionService,
    SessionCleanupService,
    TokenService,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [AuditService, AuthConfigService, PasswordService, SessionService, TokenService],
})
export class AuthModule {}
