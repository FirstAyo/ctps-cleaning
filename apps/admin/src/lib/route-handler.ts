import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const safeRequestId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export function requestIdFor(request: Request): string {
  const supplied = request.headers.get("x-request-id");
  return supplied && safeRequestId.test(supplied) ? supplied : randomUUID();
}

function upstreamUrl(path: string): URL {
  if (!process.env.API_URL) throw new Error("API_URL is not configured");
  return new URL(
    path,
    process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
  );
}

export async function forwardAuthRequest(request: Request, path: string): Promise<NextResponse> {
  const requestId = requestIdFor(request);
  try {
    const body = request.method === "GET" ? null : await request.text();
    const upstream = await fetch(upstreamUrl(path), {
      method: request.method,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        "x-csrf-token": request.headers.get("x-csrf-token") ?? "",
        "x-request-id": requestId,
      },
      ...(body === null ? {} : { body }),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    response.headers.set("x-request-id", upstream.headers.get("x-request-id") ?? requestId);
    return response;
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The administration service is unavailable." },
      { status: 503 },
    );
  }
}

export async function forwardProtectedMutation(
  request: Request,
  path: string,
): Promise<NextResponse> {
  const requestId = requestIdFor(request);
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfResponse = await fetch(upstreamUrl("auth/csrf"), {
      cache: "no-store",
      headers: { accept: "application/json", cookie, "x-request-id": requestId },
    });
    if (!csrfResponse.ok)
      return new NextResponse(await csrfResponse.text(), {
        status: csrfResponse.status,
        headers: { "content-type": "application/json" },
      });
    const csrf = (await csrfResponse.json()) as { csrfToken: string };
    const upstream = await fetch(upstreamUrl(path), {
      method: request.method,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie,
        "x-csrf-token": csrf.csrfToken,
        "x-request-id": requestId,
      },
      body: await request.text(),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    response.headers.set("x-request-id", upstream.headers.get("x-request-id") ?? requestId);
    return response;
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The administration service is unavailable." },
      { status: 503 },
    );
  }
}
