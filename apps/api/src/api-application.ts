import { Logger, ValidationPipe, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { apiEnvironmentSchema, type ApiEnvironment } from "@ctps/validation";

import { AppModule } from "./app.module";

export async function createApiApplication(): Promise<{
  app: INestApplication;
  environment: ApiEnvironment;
}> {
  const logger = new Logger("Bootstrap");
  const environmentResult = apiEnvironmentSchema.safeParse(process.env);
  if (!environmentResult.success) {
    logger.error("API environment validation failed. Review the documented environment template.");
    throw new Error("Invalid API environment configuration");
  }

  const environment = environmentResult.data;
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);
  app.use(cookieParser());
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.useGlobalPipes(
    new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }),
  );
  app.enableCors({ credentials: true, origin: environment.CORS_ALLOWED_ORIGINS });
  app.enableShutdownHooks();
  return { app, environment };
}
