import { Controller, Get, Inject } from "@nestjs/common";
import type { ApiHealthResponse, ApiReadinessResponse, DatabaseHealthResponse } from "@ctps/types";

import { HealthService } from "./health.service";
import { PublicRoute } from "../auth/security.decorators";

@PublicRoute()
@Controller("health")
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  getLiveness(): ApiHealthResponse {
    return this.healthService.getLiveness();
  }

  @Get("database")
  getDatabaseReadiness(): Promise<DatabaseHealthResponse> {
    return this.healthService.getDatabaseReadiness();
  }

  @Get("ready")
  getReadiness(): Promise<ApiReadinessResponse> {
    return this.healthService.getReadiness();
  }
}
