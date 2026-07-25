import { NextResponse } from "next/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  const { id, variant } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^(original|large|gallery|thumbnail)$/i.test(variant))
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (!process.env.API_URL) return NextResponse.json({ message: "Not found." }, { status: 404 });
  try {
    const response = await fetch(
      new URL(
        `media/before-after/${id}/${variant}`,
        process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
      ),
      { cache: "force-cache" },
    );
    if (!response.ok) return NextResponse.json({ message: "Not found." }, { status: 404 });
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "content-type": response.headers.get("content-type") ?? "image/webp",
        "content-length": response.headers.get("content-length") ?? "",
        "cache-control":
          response.headers.get("cache-control") ?? "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
}
