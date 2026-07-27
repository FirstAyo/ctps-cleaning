import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { JobNotificationService } from "../jobs/job-notification.service";
import { QuoteEmailService } from "../quote-requests/quote-email.service";

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const quotes = await app.get(QuoteEmailService).dispatchPending();
    const jobs = await app.get(JobNotificationService).dispatchPending();
    process.stdout.write(JSON.stringify({ quotes, jobs }) + "\n");
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.name : "OUTBOX_PROCESSING_FAILED"}\n`);
  process.exitCode = 1;
});
