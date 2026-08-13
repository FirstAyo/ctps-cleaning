import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BlogPage from "../src/app/blog/page";
import { GET as feed } from "../src/app/blog/feed.xml/route";
import sitemap from "../src/app/sitemap";
import { BlogArticle } from "../src/components/blog";
import type { PublicBlogPost } from "../src/lib/blog-api";

const media = {
  id: "00000000-0000-4000-8000-000000000002",
  altText: "Bright windows after careful cleaning",
  caption: "Final result",
  width: 1200,
  height: 800,
  variants: {
    featured: { path: "/media/blog/id/featured", width: 1200, height: 675 },
    "article-large": { path: "/media/blog/id/article-large", width: 1200, height: 800 },
  },
};
const published: PublicBlogPost = {
  slug: "seasonal-window-care",
  title: "Seasonal window care",
  excerpt: "Practical maintenance context for British Columbia properties.",
  content: [
    { type: "heading2", text: "Plan for the season", emphasis: false },
    { type: "paragraph", text: "Review access and conditions.", emphasis: false },
    {
      type: "richText",
      style: "heading4",
      content: [
        {
          type: "text",
          text: "Detailed guidance",
          marks: [
            { type: "bold" },
            { type: "italic" },
            { type: "underline" },
            { type: "link", href: "/services" },
          ],
        },
      ],
    },
    {
      type: "richList",
      style: "numbered",
      items: [[{ type: "text", text: "Prepare safe access", marks: [] }]],
    },
    { type: "image", mediaId: media.id },
  ],
  featuredMedia: media,
  media: [{ sortOrder: 0, media }],
  categories: [{ slug: "window-care", name: "Window Care", description: "Window guidance" }],
  tags: [{ slug: "seasonal", name: "Seasonal" }],
  author: {
    slug: "ctps-author",
    displayName: "CTPS Author",
    bio: "Property-care guidance from CTPS.",
    profileMedia: null,
  },
  seoTitle: "Seasonal window care",
  seoDescription: "Safe seasonal window-care guidance.",
  publishedAt: "2026-07-25T12:00:00.000Z",
  updatedAt: "2026-07-25T13:00:00.000Z",
  readingTimeMinutes: 2,
};

beforeEach(() => vi.stubEnv("API_URL", "http://api.test/"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function responseFor(input: string | URL | Request) {
  const path = new URL(String(input)).pathname;
  if (path.includes("taxonomy"))
    return new Response(
      JSON.stringify({
        categories: [{ id: "category", ...published.categories[0], _count: { posts: 1 } }],
        tags: [{ id: "tag", ...published.tags[0], _count: { posts: 1 } }],
      }),
    );
  if (path.includes("before-after"))
    return new Response(JSON.stringify({ items: [], page: 1, pageSize: 24, total: 0 }));
  return new Response(JSON.stringify({ items: [published], page: 1, pageSize: 24, total: 1 }));
}

describe("public blog publishing", () => {
  it("renders an honest empty state without development articles", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input) =>
        Promise.resolve(
          new URL(String(input)).pathname.includes("taxonomy")
            ? new Response(JSON.stringify({ categories: [], tags: [] }))
            : new Response(JSON.stringify({ items: [], page: 1, pageSize: 12, total: 0 })),
        ),
      ),
    );
    const html = renderToStaticMarkup(await BlogPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("No published articles match this search");
    expect(html).not.toContain("Window cleaning maintenance guide");
  });
  it("renders managed images, article semantics, captions, taxonomies, related posts, and no comments", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input) => Promise.resolve(responseFor(input))),
    );
    const listing = renderToStaticMarkup(
      await BlogPage({
        searchParams: Promise.resolve({ search: "window", category: "window-care" }),
      }),
    );
    expect(listing).toContain(published.title);
    expect(listing).toContain("2 min read");
    const article = renderToStaticMarkup(
      <BlogArticle
        post={published}
        related={[{ ...published, slug: "related-care", title: "Related care" }]}
      />,
    );
    expect(article).toContain("Final result");
    expect(article).toContain("Related articles");
    expect(article).toContain("<h4>");
    expect(article).toContain("<strong>");
    expect(article).toContain("<em>");
    expect(article).toContain("<u>");
    expect(article).toContain('href="/services"');
    expect(article).toContain("<ol>");
    expect(article).toContain("/media/blog/");
    expect(article).not.toMatch(/comment|storageKey|authorUserId/i);
  });
  it("includes published blog destinations in sitemap and feed summaries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input) => Promise.resolve(responseFor(input))),
    );
    const urls = (await sitemap()).map(({ url }) => url);
    expect(urls.some((url) => url.endsWith(`/blog/${published.slug}`))).toBe(true);
    expect(urls.some((url) => url.endsWith("/blog/category/window-care"))).toBe(true);
    const result = await feed();
    const xml = await result.text();
    expect(xml).toContain(published.title);
    expect(xml).toContain(published.excerpt);
    expect(xml).not.toContain("storageKey");
  });
});
