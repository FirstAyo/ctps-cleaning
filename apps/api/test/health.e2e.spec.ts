import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatabaseService } from "../src/database/database.service";
import { HealthModule } from "../src/health/health.module";

describe("health endpoints", () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  async function createApp(checkConnection: () => Promise<void>): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] })
      .overrideProvider(DatabaseService)
      .useValue({ checkConnection })
      .compile();

    const testApp = moduleRef.createNestApplication();
    await testApp.init();
    app = testApp;
    return testApp;
  }

  it("serves the liveness response", async () => {
    const testApp = await createApp(vi.fn().mockResolvedValue(undefined));
    const response = await request(testApp.getHttpServer()).get("/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      status: "ok",
      service: "ctps-api",
      release: "development",
    });
    expect(new Date(response.body.timestamp as string).toString()).not.toBe("Invalid Date");
  });

  it("reports combined database and storage readiness without exposing paths", async () => {
    const testApp = await createApp(vi.fn().mockResolvedValue(undefined));
    const response = await request(testApp.getHttpServer()).get("/health/ready").expect(200);
    expect(response.body).toMatchObject({
      success: true,
      status: "ready",
      database: "connected",
      storage: "writable",
      release: "development",
    });
    expect(JSON.stringify(response.body)).not.toMatch(/storage[\\/]|postgresql:|secret/i);
  });

  it("reports database readiness after a successful Prisma check", async () => {
    const checkConnection = vi.fn().mockResolvedValue(undefined);
    const testApp = await createApp(checkConnection);
    const response = await request(testApp.getHttpServer()).get("/health/database").expect(200);

    expect(checkConnection).toHaveBeenCalledOnce();
    expect(response.body).toMatchObject({
      success: true,
      status: "ready",
      database: "connected",
    });
  });

  it("fails safely when the database check rejects", async () => {
    const testApp = await createApp(
      vi.fn().mockRejectedValue(new Error("postgresql://user:secret@private-host/database")),
    );
    const response = await request(testApp.getHttpServer()).get("/health/database").expect(503);
    const serialized = JSON.stringify(response.body);

    expect(response.body).toMatchObject({
      success: false,
      status: "unavailable",
      database: "unavailable",
    });
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("private-host");
  });
});
