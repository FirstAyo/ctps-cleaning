import { NextResponse } from "next/server";

function upstreamUrl(path: string): URL {
  if (!process.env.API_URL) throw new Error("API_URL is not configured");
  return new URL(
    path,
    process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
  );
}

export async function forwardAuthRequest(request: Request, path: string): Promise<NextResponse> {
  try {
    const body = request.method === "GET" ? null : await request.text();
    const upstream = await fetch(upstreamUrl(path), {
      method: request.method,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        "x-csrf-token": request.headers.get("x-csrf-token") ?? "",
      },
      ...(body === null ? {} : { body }),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
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
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfResponse = await fetch(upstreamUrl("auth/csrf"), {
      cache: "no-store",
      headers: { accept: "application/json", cookie },
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
      headers: { "content-type": "application/json", cookie, "x-csrf-token": csrf.csrfToken },
      body: await request.text(),
    });
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    return response;
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The administration service is unavailable." },
      { status: 503 },
    );
  }
}
