import { Logger } from "@nestjs/common";
import { createApiApplication } from "./api-application";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const { app, environment } = await createApiApplication();
  await app.listen(environment.API_PORT, "0.0.0.0");
  logger.log(`CTPS API foundation listening on port ${environment.API_PORT}`);
}

void bootstrap();
