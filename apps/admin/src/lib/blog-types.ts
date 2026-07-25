export type BlogBlock =
  | { type: "paragraph" | "heading2" | "heading3" | "blockquote"; text: string; emphasis: boolean }
  | { type: "bulletList" | "numberedList"; items: string[] }
  | { type: "link"; text: string; href: string; emphasis: boolean }
  | { type: "image"; mediaId: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "divider" };
export interface BlogMedia {
  id: string;
  originalFilename: string;
  altText: string;
  caption: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  width: number;
  height: number;
}
export interface BlogPostAdmin {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: BlogBlock[];
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  authorUserId: string;
  author: { displayName: string };
  featuredMediaId: string | null;
  featuredMedia: BlogMedia | null;
  media: { mediaId: string; sortOrder: number; media: BlogMedia }[];
  categories: BlogTaxonomy[];
  tags: BlogTaxonomy[];
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  readingTimeMinutes: number;
  version: number;
  revisionCount: number;
  updatedAt: string;
}
export interface BlogTaxonomy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { posts: number };
}
