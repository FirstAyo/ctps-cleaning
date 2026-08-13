export type BlogBlock =
  | { type: "paragraph" | "heading2" | "heading3" | "blockquote"; text: string; emphasis: boolean }
  | { type: "bulletList" | "numberedList"; items: string[] }
  | { type: "link"; text: string; href: string; emphasis: boolean }
  | { type: "image"; mediaId: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "divider" }
  | {
      type: "richText";
      style: "paragraph" | "heading2" | "heading3" | "heading4" | "blockquote";
      content: BlogInlineContent[];
    }
  | { type: "richList"; style: "bullet" | "numbered"; items: BlogInlineContent[][] }
  | { type: "managedImage"; mediaId: string; layout: "standard" | "wide" | "full" };
export interface BlogInlineContent {
  type: "text";
  text: string;
  marks: Array<{ type: "bold" | "italic" | "underline" } | { type: "link"; href: string }>;
}
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
