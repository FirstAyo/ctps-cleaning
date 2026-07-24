import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import type {
  ApiHealthResponse,
  DatabaseHealthFailureResponse,
  DatabaseHealthResponse,
} from "@ctps/types";

import { DatabaseService } from "../database/database.service";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  getLiveness(): ApiHealthResponse {
    return {
      success: true,
      status: "ok",
      service: "ctps-api",
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseReadiness(): Promise<DatabaseHealthResponse> {
    try {
      await this.databaseService.checkConnection();

      return {
        success: true,
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch {
      this.logger.warn("Database readiness check failed");

      const response: DatabaseHealthFailureResponse = {
        success: false,
        status: "unavailable",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      };

      throw new ServiceUnavailableException(response);
    }
  }
}
