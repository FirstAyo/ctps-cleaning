export interface ApiHealthResponse {
  readonly success: true;
  readonly status: "ok";
  readonly service: "ctps-api";
  readonly timestamp: string;
  readonly release: string;
}

export interface ApiReadinessResponse {
  readonly success: true;
  readonly status: "ready";
  readonly database: "connected";
  readonly storage: "writable";
  readonly timestamp: string;
  readonly release: string;
}

export interface ApiReadinessFailureResponse {
  readonly success: false;
  readonly status: "unavailable";
  readonly database: "connected" | "unavailable";
  readonly storage: "writable" | "unavailable";
  readonly timestamp: string;
  readonly release: string;
}

export interface DatabaseHealthResponse {
  readonly success: true;
  readonly status: "ready";
  readonly database: "connected";
  readonly timestamp: string;
}

export interface DatabaseHealthFailureResponse {
  readonly success: false;
  readonly status: "unavailable";
  readonly database: "unavailable";
  readonly timestamp: string;
}

export type AvailabilityState = "available" | "unavailable" | "unknown";

export interface FoundationHealthStatus {
  readonly api: AvailabilityState;
  readonly database: AvailabilityState;
}
