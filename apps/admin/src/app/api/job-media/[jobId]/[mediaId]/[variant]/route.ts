import { NextResponse } from "next/server";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string; mediaId: string; variant: string }> },
) {
  const { jobId, mediaId, variant } = await params;
  if (
    !/^[0-9a-f-]{36}$/i.test(jobId) ||
    !/^[0-9a-f-]{36}$/i.test(mediaId) ||
    !/^(original|large|standard|thumbnail)$/.test(variant) ||
    !process.env.API_URL
  )
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  try {
    const upstream = await fetch(
      new URL(
        `admin/jobs/${jobId}/media/${mediaId}/${variant}`,
        process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
      ),
      { cache: "no-store", headers: { cookie: request.headers.get("cookie") ?? "" } },
    );
    if (!upstream.ok)
      return NextResponse.json({ message: "Not found." }, { status: upstream.status });
    return new NextResponse(upstream.body, {
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "image/webp",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
}
