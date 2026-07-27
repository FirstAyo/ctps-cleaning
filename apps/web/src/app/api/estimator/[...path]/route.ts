import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const allowed =
  /^(configuration|calculate|results\/[A-Za-z0-9_-]{43}(?:\/quote-transfer)?|quote-transfer\/[A-Za-z0-9_-]{43})$/;
async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join("/");
  if (!allowed.test(path))
    return NextResponse.json({ code: "NOT_FOUND", message: "Not found." }, { status: 404 });
  const webOrigin = new URL(process.env.WEB_URL ?? "http://localhost:3000").origin;
  if (request.method !== "GET") {
    const supplied = request.headers.get("origin") ?? request.headers.get("referer");
    try {
      if (!supplied || new URL(supplied).origin !== webOrigin) throw new Error();
    } catch {
      return NextResponse.json(
        { code: "ORIGIN_REJECTED", message: "The request origin was rejected." },
        { status: 403 },
      );
    }
  }
  if (!process.env.API_URL)
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The estimator is temporarily unavailable." },
      { status: 503 },
    );
  try {
    const suppliedRequestId = request.headers.get("x-request-id");
    const requestId =
      suppliedRequestId && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(suppliedRequestId)
        ? suppliedRequestId
        : randomUUID();
    const response = await fetch(
      new URL(
        `public/estimator/${path}`,
        process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
      ),
      {
        method: request.method,
        cache: "no-store",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          origin: webOrigin,
          "x-request-id": requestId,
        },
        ...(request.method === "GET" ? {} : { body: (await request.text()) || "{}" }),
      },
    );
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
      { code: "API_UNAVAILABLE", message: "The estimator is temporarily unavailable." },
      { status: 503 },
    );
  }
}
export const GET = forward;
export const POST = forward;
