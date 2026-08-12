import { NextResponse } from "next/server";

function url(path: string) {
  if (!process.env.API_URL) throw new Error("API unavailable");
  return new URL(
    path,
    process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
  );
}
export async function GET(request: Request) {
  try {
    const incoming = new URL(request.url);
    const id = incoming.searchParams.get("id");
    const usage = incoming.searchParams.get("usage") === "true";
    if (id && !/^[0-9a-f-]{36}$/i.test(id))
      return NextResponse.json(
        { code: "INVALID_ID", message: "Invalid media identifier." },
        { status: 400 },
      );
    const path = id ? `admin/media-library/${id}${usage ? "/usage" : ""}` : "admin/media-library";
    const target = url(path);
    if (!id)
      for (const key of ["page", "pageSize", "search", "filter", "status"]) {
        const value = incoming.searchParams.get(key);
        if (value !== null) target.searchParams.set(key, value);
      }
    const upstream = await fetch(target, {
      cache: "no-store",
      headers: { accept: "application/json", cookie: request.headers.get("cookie") ?? "" },
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The public media service is unavailable." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfResponse = await fetch(url("auth/csrf"), { cache: "no-store", headers: { cookie } });
    if (!csrfResponse.ok)
      return new NextResponse(await csrfResponse.text(), {
        status: csrfResponse.status,
        headers: { "content-type": "application/json" },
      });
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    const upstream = await fetch(url("admin/media-library"), {
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
      { code: "API_UNAVAILABLE", message: "The public media service is unavailable." },
      { status: 503 },
    );
  }
}
