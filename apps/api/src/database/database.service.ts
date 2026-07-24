import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";
import { checkDatabaseConnection, connectDatabase, disconnectDatabase } from "@ctps/database";

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit(): Promise<void> {
    try {
      await connectDatabase();
    } catch {
      this.logger.warn("Initial database connection unavailable; readiness checks will report it");
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await disconnectDatabase();
  }

  async checkConnection(): Promise<void> {
    await checkDatabaseConnection();
  }
}
