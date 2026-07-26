import { NextResponse } from "next/server";
function base(path: string) {
  if (!process.env.API_URL) throw new Error("API_URL is not configured");
  return new URL(
    path,
    process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
  );
}
export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(jobId))
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  try {
    const cookie = request.headers.get("cookie") ?? "";
    const csrfResponse = await fetch(base("auth/csrf"), { cache: "no-store", headers: { cookie } });
    if (!csrfResponse.ok)
      return NextResponse.json(
        { message: "Authentication required." },
        { status: csrfResponse.status },
      );
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    const upstream = await fetch(base(`admin/jobs/${jobId}/media`), {
      method: "POST",
      cache: "no-store",
      headers: {
        cookie,
        "x-csrf-token": csrfToken,
        "content-type": request.headers.get("content-type") ?? "application/octet-stream",
      },
      body: await request.arrayBuffer(),
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { code: "API_UNAVAILABLE", message: "The administration service is unavailable." },
      { status: 503 },
    );
  }
}
