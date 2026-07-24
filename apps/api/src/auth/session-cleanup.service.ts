import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";
import { AuthConfigService } from "./auth-config.service";

@Injectable()
export class SessionCleanupService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuthConfigService) private readonly config: AuthConfigService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(
      () => void this.cleanup(),
      this.config.value.AUTH_SESSION_CLEANUP_SECONDS * 1000,
    );
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    await this.database.client.$transaction([
      this.database.client.session.deleteMany({
        where: {
          OR: [
            { absoluteExpiresAt: { lt: now } },
            { idleExpiresAt: { lt: now } },
            { revokedAt: { lt: new Date(now.getTime() - 86_400_000) } },
          ],
        },
      }),
      this.database.client.loginThrottle.deleteMany({
        where: {
          updatedAt: {
            lt: new Date(now.getTime() - this.config.value.LOGIN_THROTTLE_WINDOW_SECONDS * 1000),
          },
          OR: [{ blockedUntil: null }, { blockedUntil: { lt: now } }],
        },
      }),
    ]);
  }
}
