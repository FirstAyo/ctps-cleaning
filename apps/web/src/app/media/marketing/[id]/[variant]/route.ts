import { NextResponse } from "next/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  const { id, variant } = await params;
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !/^(original|hero|large|standard|thumbnail)$/i.test(variant) ||
    !process.env.API_URL
  )
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  try {
    const response = await fetch(
      new URL(
        `media/marketing/${id}/${variant}`,
        process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
      ),
    );
    if (!response.ok)
      return NextResponse.json({ message: "Not found." }, { status: response.status });
    return new NextResponse(response.body, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "image/webp",
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
}
