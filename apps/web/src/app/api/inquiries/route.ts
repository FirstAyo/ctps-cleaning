import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
      { code: "API_UNAVAILABLE", message: "Messages are temporarily unavailable." },
      { status: 503 },
    );
  const requestId = randomUUID();
  try {
    const response = await fetch(
      new URL("public/general-inquiries", api.endsWith("/") ? api : `${api}/`),
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          origin: expected,
          "x-request-id": requestId,
        },
        body: await request.text(),
        cache: "no-store",
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
      { code: "API_UNAVAILABLE", message: "Messages are temporarily unavailable." },
      { status: 503 },
    );
  }
}
