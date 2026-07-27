import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const allowed = /^(drafts|uploads(?:\/[0-9a-f-]{36}|\/order)?|submit)$/i;

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join("/");
  if (!allowed.test(path))
    return NextResponse.json({ code: "NOT_FOUND", message: "Not found." }, { status: 404 });
  const expected = new URL(process.env.WEB_URL ?? "http://localhost:3000").origin;
  const supplied = request.headers.get("origin") ?? request.headers.get("referer");
  try {
    if (!supplied || new URL(supplied).origin !== expected) throw new Error();
  } catch {
    return NextResponse.json(
      { code: "ORIGIN_REJECTED", message: "The request origin was rejected." },
      { status: 403 },
    );
  }
  const api = process.env.API_URL;
  if (!api)
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "Quote requests are temporarily unavailable." },
      { status: 503 },
    );
  const targetPath = path === "submit" ? "public/quote-requests" : `public/quote-requests/${path}`;
  const headers = new Headers();
  const suppliedRequestId = request.headers.get("x-request-id");
  const requestId =
    suppliedRequestId && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
  headers.set("origin", expected);
  headers.set("accept", "application/json");
  headers.set("x-request-id", requestId);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const token = request.headers.get("x-quote-draft-token");
  if (token) headers.set("x-quote-draft-token", token);
  try {
    const response = await fetch(new URL(targetPath, api.endsWith("/") ? api : `${api}/`), {
      method: request.method,
      headers,
      ...(["GET", "HEAD"].includes(request.method) ? {} : { body: await request.arrayBuffer() }),
      cache: "no-store",
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
        "x-request-id": response.headers.get("x-request-id") ?? requestId,
      },
    });
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "Quote requests are temporarily unavailable." },
      { status: 503 },
    );
  }
}
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
