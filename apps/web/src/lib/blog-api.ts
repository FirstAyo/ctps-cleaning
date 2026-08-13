import "server-only";

export interface PublicBlogInlineContent {
  type: "text";
  text: string;
  marks: Array<{ type: "bold" | "italic" | "underline" } | { type: "link"; href: string }>;
}
export type PublicBlogBlock =
  | { type: "paragraph" | "heading2" | "heading3" | "blockquote"; text: string; emphasis: boolean }
  | { type: "bulletList" | "numberedList"; items: string[] }
  | { type: "link"; text: string; href: string; emphasis: boolean }
  | { type: "image"; mediaId: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "divider" }
  | {
      type: "richText";
      style: "paragraph" | "heading2" | "heading3" | "heading4" | "blockquote";
      content: PublicBlogInlineContent[];
    }
  | { type: "richList"; style: "bullet" | "numbered"; items: PublicBlogInlineContent[][] }
  | { type: "managedImage"; mediaId: string; layout: "standard" | "wide" | "full" };
export interface PublicBlogMedia {
  id: string;
  altText: string;
  caption: string | null;
  width: number;
  height: number;
  variants: Record<string, { path: string; width: number; height: number }>;
}
export interface PublicBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: PublicBlogBlock[];
  featuredMedia: PublicBlogMedia | null;
  media: { sortOrder: number; media: PublicBlogMedia | null }[];
  categories: { slug: string; name: string; description: string }[];
  tags: { slug: string; name: string }[];
  author: {
    slug: string | null;
    displayName: string;
    bio: string;
    profileMedia: PublicBlogMedia | null;
  };
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
}
export interface PublicTaxonomy {
  id: string;
  slug: string;
  name: string;
  description?: string;
  _count: { posts: number };
}
function apiUrl(path: string) {
  const base = process.env.API_URL;
  return base ? new URL(path, base.endsWith("/") ? base : `${base}/`) : null;
}
async function read<T>(path: string): Promise<T | null> {
  const url = apiUrl(path);
  if (!url) return null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}
export async function getBlogPosts(query: Record<string, string> = {}) {
  const url = apiUrl("public/blog/posts");
  if (!url) return { items: [] as PublicBlogPost[], page: 1, pageSize: 12, total: 0 };
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const response = await fetch(url, { cache: "no-store" });
    return response.ok
      ? ((await response.json()) as {
          items: PublicBlogPost[];
          page: number;
          pageSize: number;
          total: number;
        })
      : { items: [], page: 1, pageSize: 12, total: 0 };
  } catch {
    return { items: [], page: 1, pageSize: 12, total: 0 };
  }
}
export const getBlogPost = (slug: string) =>
  read<{ post?: PublicBlogPost; related?: PublicBlogPost[]; redirectTo?: string }>(
    `public/blog/posts/${encodeURIComponent(slug)}`,
  );
export async function getBlogTaxonomy() {
  return (
    (await read<{ categories: PublicTaxonomy[]; tags: PublicTaxonomy[] }>(
      "public/blog/taxonomy",
    )) ?? { categories: [], tags: [] }
  );
}
export const getBlogAuthor = (slug: string) =>
  read<{ author: PublicBlogPost["author"]; posts: PublicBlogPost[] }>(
    `public/blog/authors/${encodeURIComponent(slug)}`,
  );
