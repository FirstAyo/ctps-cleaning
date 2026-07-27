import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import type { ApiEnvironment } from "@ctps/validation";
import type { CorrelatedRequest } from "./request-context.middleware";

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  constructor(private readonly environment: ApiEnvironment) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<CorrelatedRequest>();
    const response = context.getResponse<Response>();
    const requestId = request.correlationId ?? "unavailable";
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      response
        .status(exception.getStatus())
        .json(
          typeof payload === "string"
            ? { statusCode: exception.getStatus(), message: payload, requestId }
            : { ...(payload as object), requestId },
        );
      return;
    }

    const event = {
      timestamp: new Date().toISOString(),
      service: "ctps-api",
      environment: this.environment.NODE_ENV,
      level: "error",
      event: "http.request.failed",
      requestId,
      method: request.method,
      route: request.route?.path ?? "unmatched",
      errorCode: "INTERNAL_ERROR",
      ...(this.environment.NODE_ENV === "development" && exception instanceof Error
        ? { errorName: exception.name }
        : {}),
    };
    process.stderr.write(`${JSON.stringify(event)}\n`);
    response.status(500).json({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "The request could not be completed.",
      requestId,
    });
  }
}
