import { HttpException, Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";
import { AuthConfigService } from "./auth-config.service";
import { TokenService } from "./token.service";

const genericAuthenticationError = {
  code: "AUTHENTICATION_FAILED",
  message: "Unable to sign in with those credentials.",
};

@Injectable()
export class LoginThrottleService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuthConfigService) private readonly config: AuthConfigService,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  key(email: string, source: string): string {
    return this.tokens.hashToken(`${source}\0${email}`);
  }

  async assertAllowed(keyHash: string): Promise<void> {
    const entry = await this.database.client.loginThrottle.findUnique({ where: { keyHash } });
    if (entry?.blockedUntil && entry.blockedUntil > new Date()) {
      throw new HttpException(genericAuthenticationError, 429);
    }
  }

  async registerFailure(keyHash: string): Promise<void> {
    const now = new Date();
    const windowMilliseconds = this.config.value.LOGIN_THROTTLE_WINDOW_SECONDS * 1000;
    await this.database.client.$transaction(async (transaction) => {
      const current = await transaction.loginThrottle.findUnique({ where: { keyHash } });
      const outsideWindow =
        !current || now.getTime() - current.windowStartedAt.getTime() >= windowMilliseconds;
      const attempts = outsideWindow ? 1 : current.attempts + 1;
      const blockedUntil =
        attempts >= this.config.value.LOGIN_THROTTLE_MAX_ATTEMPTS
          ? new Date(now.getTime() + windowMilliseconds)
          : null;
      await transaction.loginThrottle.upsert({
        where: { keyHash },
        create: { keyHash, attempts, windowStartedAt: now, blockedUntil },
        update: { attempts, ...(outsideWindow ? { windowStartedAt: now } : {}), blockedUntil },
      });
    });
  }

  async clear(keyHash: string): Promise<void> {
    await this.database.client.loginThrottle.deleteMany({ where: { keyHash } });
  }
}
