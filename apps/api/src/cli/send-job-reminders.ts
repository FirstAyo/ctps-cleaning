import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { JobNotificationService } from "../jobs/job-notification.service";

async function main() {
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  try {
    console.info(await context.get(JobNotificationService).queueDueReminders());
  } finally {
    await context.close();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Job reminder processing failed.");
  process.exitCode = 1;
});
