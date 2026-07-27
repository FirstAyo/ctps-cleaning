import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ApiHealthResponse,
  ApiReadinessFailureResponse,
  ApiReadinessResponse,
  DatabaseHealthFailureResponse,
  DatabaseHealthResponse,
} from "@ctps/types";

import { DatabaseService } from "../database/database.service";

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly release = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(
    process.env.RELEASE_VERSION ?? "development",
  )
    ? (process.env.RELEASE_VERSION ?? "development")
    : "invalid";

  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  getLiveness(): ApiHealthResponse {
    return {
      success: true,
      status: "ok",
      service: "ctps-api",
      timestamp: new Date().toISOString(),
      release: this.release,
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

  private async checkStorage(): Promise<void> {
    const roots = new Set([
      process.env.MEDIA_LOCAL_PUBLIC_ROOT ?? "../../storage/public/before-after",
      process.env.MEDIA_LOCAL_PRIVATE_ROOT ?? "../../storage/private/before-after",
      process.env.QUOTE_PRIVATE_MEDIA_ROOT ?? "../../storage/private/quote-requests",
      process.env.BLOG_LOCAL_PUBLIC_ROOT ?? "../../storage/public/blog",
      process.env.BLOG_LOCAL_PRIVATE_ROOT ?? "../../storage/private/blog",
      process.env.JOBS_PRIVATE_MEDIA_ROOT ?? "../../storage/private/jobs",
    ]);
    for (const configuredRoot of roots) {
      const root = path.resolve(process.cwd(), configuredRoot);
      await mkdir(root, { recursive: true });
      const probe = path.join(root, `.ctps-health-${randomUUID()}.tmp`);
      try {
        await writeFile(probe, "ctps-storage-readiness", {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        });
        if ((await readFile(probe, "utf8")) !== "ctps-storage-readiness")
          throw new Error("Storage probe mismatch");
      } finally {
        await unlink(probe).catch(() => undefined);
      }
    }
  }

  async getReadiness(): Promise<ApiReadinessResponse> {
    let database: "connected" | "unavailable" = "unavailable";
    let storage: "writable" | "unavailable" = "unavailable";
    try {
      await this.databaseService.checkConnection();
      database = "connected";
      await this.checkStorage();
      storage = "writable";
      return {
        success: true,
        status: "ready",
        database,
        storage,
        timestamp: new Date().toISOString(),
        release: this.release,
      };
    } catch {
      this.logger.warn("Application readiness check failed");
      const response: ApiReadinessFailureResponse = {
        success: false,
        status: "unavailable",
        database,
        storage,
        timestamp: new Date().toISOString(),
        release: this.release,
      };
      throw new ServiceUnavailableException(response);
    }
  }
}
