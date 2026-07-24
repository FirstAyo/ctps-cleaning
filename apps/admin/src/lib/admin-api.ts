import "server-only";

import { cookies } from "next/headers";

export interface AdminIdentity {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: "ACTIVE" | "DISABLED";
  readonly mustChangePassword: boolean;
  readonly roleKeys: readonly string[];
  readonly permissions: readonly string[];
  readonly session: {
    readonly id: string;
    readonly createdAt: string;
    readonly absoluteExpiresAt: string;
    readonly idleExpiresAt: string;
  };
}

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function apiUrl(path: string): URL {
  const base = process.env.API_URL;
  if (!base)
    throw new AdminApiError(503, "API_UNAVAILABLE", "The administration service is unavailable.");
  return new URL(path, base.endsWith("/") ? base : `${base}/`);
}

export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      headers: { accept: "application/json", cookie: cookieStore.toString(), ...init.headers },
    });
  } catch {
    throw new AdminApiError(503, "API_UNAVAILABLE", "The administration service is unavailable.");
  }
  const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!response.ok)
    throw new AdminApiError(
      response.status,
      body.code ?? "REQUEST_FAILED",
      body.message ?? "The request could not be completed.",
    );
  return body as T;
}

export async function currentIdentity(): Promise<AdminIdentity | null> {
  try {
    const result = await adminApi<{ user: AdminIdentity }>("auth/me");
    return result.user;
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) return null;
    throw error;
  }
}

export function can(identity: AdminIdentity, permission: string): boolean {
  return identity.permissions.includes(permission);
}
