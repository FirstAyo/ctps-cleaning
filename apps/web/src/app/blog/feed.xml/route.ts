import { site } from "@/content/site";
import { getBlogPosts } from "@/lib/blog-api";

const xml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export async function GET() {
  const result = await getBlogPosts({ pageSize: "24" });
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(site.name)} Blog</title><link>${xml(new URL("/blog", site.url).toString())}</link><description>${xml(site.description)}</description>${result.items.map((post) => `<item><title>${xml(post.title)}</title><link>${xml(new URL(`/blog/${post.slug}`, site.url).toString())}</link><guid isPermaLink="true">${xml(new URL(`/blog/${post.slug}`, site.url).toString())}</guid><description>${xml(post.excerpt)}</description><pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`;
  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=900",
    },
  });
}
