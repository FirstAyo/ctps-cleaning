import { Injectable, Inject, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { QuoteMediaService } from "./quote-media.service";
import { QuoteEmailService } from "./quote-email.service";

@Injectable()
export class QuoteCleanupService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(
    @Inject(QuoteMediaService) private readonly media: QuoteMediaService,
    @Inject(QuoteEmailService) private readonly email: QuoteEmailService,
  ) {}
  onModuleInit() {
    this.timer = setInterval(
      () => {
        void Promise.all([this.media.deleteExpiredDrafts(), this.email.dispatchPending()]).catch(
          () => undefined,
        );
      },
      60 * 60 * 1000,
    );
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
