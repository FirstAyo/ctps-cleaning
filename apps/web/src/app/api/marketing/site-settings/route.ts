import { NextResponse } from "next/server";
export async function GET() {
  if (!process.env.API_URL) return NextResponse.json({});
  try {
    const response = await fetch(
      new URL(
        "public/site-settings",
        process.env.API_URL.endsWith("/") ? process.env.API_URL : `${process.env.API_URL}/`,
      ),
      { next: { revalidate: 60 } },
    );
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json({});
  }
}
