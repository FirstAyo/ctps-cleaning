import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { apiEnvironmentSchema } from "@ctps/validation";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const environmentResult = apiEnvironmentSchema.safeParse(process.env);

  if (!environmentResult.success) {
    logger.error("API environment validation failed. Review the documented environment template.");
    throw new Error("Invalid API environment configuration");
  }

  const environment = environmentResult.data;
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    credentials: false,
    origin: environment.CORS_ALLOWED_ORIGINS,
  });
  app.enableShutdownHooks();

  await app.listen(environment.API_PORT, "0.0.0.0");
  logger.log(`CTPS API foundation listening on port ${environment.API_PORT}`);
}

void bootstrap();
