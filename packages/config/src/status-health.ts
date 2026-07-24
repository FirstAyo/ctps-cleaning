import type { FoundationHealthStatus } from "@ctps/types";
import {
  apiHealthResponseSchema,
  databaseHealthResponseSchema,
  statusPageEnvironmentSchema,
} from "@ctps/validation";

const timeoutMilliseconds = 2_000;

async function fetchJson(url: string): Promise<{ ok: boolean; value: unknown }> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMilliseconds),
  });

  return { ok: response.ok, value: await response.json() };
}

/** Server-only status helper. Do not import this function into a Client Component. */
export async function fetchFoundationHealth(
  environment: NodeJS.ProcessEnv,
): Promise<FoundationHealthStatus> {
  const { API_URL } = statusPageEnvironmentSchema.parse(environment);

  try {
    const apiResult = await fetchJson(`${API_URL}/health`);
    if (!apiResult.ok || !apiHealthResponseSchema.safeParse(apiResult.value).success) {
      return { api: "unavailable", database: "unknown" };
    }
  } catch {
    return { api: "unavailable", database: "unknown" };
  }

  try {
    const databaseResult = await fetchJson(`${API_URL}/health/database`);
    const databaseReady =
      databaseResult.ok && databaseHealthResponseSchema.safeParse(databaseResult.value).success;

    return {
      api: "available",
      database: databaseReady ? "available" : "unavailable",
    };
  } catch {
    return { api: "available", database: "unavailable" };
  }
}
