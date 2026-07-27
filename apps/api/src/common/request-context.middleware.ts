import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { ApiEnvironment } from "@ctps/validation";

export type CorrelatedRequest = Request & { correlationId?: string };

const safeRequestId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function requestIdFrom(request: Request): string {
  const supplied = request.header("x-request-id");
  return supplied && safeRequestId.test(supplied) ? supplied : randomUUID();
}

export function createRequestContextMiddleware(environment: ApiEnvironment) {
  return (request: CorrelatedRequest, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();
    const correlationId = requestIdFrom(request);
    request.correlationId = correlationId;
    response.setHeader("x-request-id", correlationId);
    response.on("finish", () => {
      const event = {
        timestamp: new Date().toISOString(),
        service: "ctps-api",
        environment: environment.NODE_ENV,
        level: response.statusCode >= 500 ? "error" : "info",
        event: "http.request.completed",
        requestId: correlationId,
        method: request.method,
        route: request.route?.path ?? "unmatched",
        statusCode: response.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      };
      if (environment.LOG_FORMAT === "json") process.stdout.write(`${JSON.stringify(event)}\n`);
    });
    next();
  };
}
