import { NestFactory } from "@nestjs/core";
import { ROLE_KEYS } from "@ctps/permissions";

import { AppModule } from "../app.module";
import { DatabaseService } from "../database/database.service";
import { MarketingService } from "../marketing/marketing.service";

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const database = app.get(DatabaseService);
    const marketing = app.get(MarketingService);
    const actor = await database.client.user.findFirst({
      where: { status: "ACTIVE", roles: { some: { role: { key: ROLE_KEYS.SUPER_ADMIN } } } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!actor)
      throw new Error("Create the initial Super Admin before initializing marketing content.");
    const result = await marketing.initialize(actor.id);
    process.stdout.write(
      `Marketing content is initialized (${result.created} pages created; ${result.total} total).\n`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Initialization failed."}\n`);
  process.exitCode = 1;
});
