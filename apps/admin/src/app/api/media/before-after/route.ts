import { NextResponse } from "next/server";

function apiUrl(path: string) {
  if (!process.env.API_URL) throw new Error("API unavailable");
  return new URL(
    path,
    process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
  );
}
export async function POST(request: Request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfResponse = await fetch(apiUrl("auth/csrf"), {
      cache: "no-store",
      headers: { accept: "application/json", cookie },
    });
    if (!csrfResponse.ok)
      return new NextResponse(await csrfResponse.text(), {
        status: csrfResponse.status,
        headers: { "content-type": "application/json" },
      });
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    const upstream = await fetch(apiUrl("admin/media/before-after"), {
      method: "POST",
      cache: "no-store",
      headers: { cookie, "x-csrf-token": csrfToken },
      body: await request.formData(),
    });
    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The media service is unavailable." },
      { status: 503 },
    );
  }
}
