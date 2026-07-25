import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  const { id, variant } = await params;
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !/^(original|featured|article-large|article-standard|thumbnail)$/i.test(variant) ||
    !process.env.API_URL
  )
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  try {
    const upstream = await fetch(
      new URL(
        `admin/blog/media/${id}/${variant}`,
        process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
      ),
      { cache: "no-store", headers: { cookie: request.headers.get("cookie") ?? "" } },
    );
    if (!upstream.ok)
      return NextResponse.json({ message: "Not found." }, { status: upstream.status });
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "image/webp",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
}
