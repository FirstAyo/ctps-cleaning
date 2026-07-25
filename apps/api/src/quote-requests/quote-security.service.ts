import { createHash, randomBytes } from "node:crypto";
import { ForbiddenException, HttpException, HttpStatus, Injectable, Inject } from "@nestjs/common";
import type { Request } from "express";
import { DatabaseService } from "../database/database.service";
import { QuoteConfigService } from "./quote-config.service";

@Injectable()
export class QuoteSecurityService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(QuoteConfigService) private readonly config: QuoteConfigService,
  ) {}
  token() {
    return randomBytes(32).toString("base64url");
  }
  hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
  source(request: Request) {
    return this.hash(`${request.ip ?? "unknown"}|${request.get("user-agent") ?? "unknown"}`);
  }
  assertTrustedBrowser(request: Request) {
    const expected = new URL(this.config.value.WEB_URL).origin;
    const supplied = request.get("origin") ?? request.get("referer");
    if (!supplied)
      throw new ForbiddenException({
        code: "ORIGIN_REQUIRED",
        message: "The request origin could not be verified.",
      });
    try {
      if (new URL(supplied).origin !== expected) throw new Error();
    } catch {
      throw new ForbiddenException({
        code: "ORIGIN_REJECTED",
        message: "The request origin was rejected.",
      });
    }
  }
  async throttle(request: Request, action: string) {
    const now = new Date();
    const keyHash = this.hash(`${action}|${this.source(request)}`);
    const windowMs = this.config.value.QUOTE_RATE_LIMIT_WINDOW_SECONDS * 1000;
    const maximum = this.config.value.QUOTE_RATE_LIMIT_MAX_ATTEMPTS;
    const record = await this.database.client.publicRequestThrottle.upsert({
      where: { keyHash },
      create: { keyHash, attempts: 1, windowStartedAt: now },
      update: {},
    });
    if (record.blockedUntil && record.blockedUntil > now)
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Too many requests. Please wait and try again." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    if (now.getTime() - record.windowStartedAt.getTime() >= windowMs) {
      await this.database.client.publicRequestThrottle.update({
        where: { keyHash },
        data: { attempts: 1, windowStartedAt: now, blockedUntil: null },
      });
      return;
    }
    if (record.attempts >= maximum) {
      await this.database.client.publicRequestThrottle.update({
        where: { keyHash },
        data: { blockedUntil: new Date(now.getTime() + windowMs) },
      });
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Too many requests. Please wait and try again." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.database.client.publicRequestThrottle.update({
      where: { keyHash },
      data: { attempts: { increment: 1 } },
    });
  }
}
