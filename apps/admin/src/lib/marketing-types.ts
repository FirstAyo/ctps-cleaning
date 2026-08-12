export interface MarketingCta {
  label: string;
  href: string;
}
export interface MarketingItem {
  key: string;
  title: string;
  body?: string;
  href?: string;
  mediaId?: string;
  altText?: string;
}
export interface MarketingSection {
  id: string;
  type: string;
  enabled: boolean;
  eyebrow?: string;
  title: string;
  body?: string;
  primaryCta?: MarketingCta;
  secondaryCta?: MarketingCta;
  mediaIds: string[];
  overlay?: "SOFT" | "BALANCED" | "STRONG";
  autoplay?: boolean;
  intervalMs?: 6000 | 7000 | 8000 | 10000;
  items?: MarketingItem[];
  projectIds?: string[];
  postIds?: string[];
}
export interface MarketingPage {
  id: string;
  pageKey: string;
  slug: string;
  title: string;
  navigationLabel: string | null;
  pageType: string;
  status: "DRAFT" | "PUBLISHED";
  draftContent: { sections: MarketingSection[] };
  publishedContent: { sections: MarketingSection[] } | null;
  version: number;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  socialImageId: string | null;
  updatedAt: string;
  publishedAt: string | null;
  revisions: Array<{
    id: string;
    revisionNumber: number;
    createdAt: string;
    createdBy: { displayName: string };
  }>;
}
export interface MarketingPageListItem extends Pick<
  MarketingPage,
  "pageKey" | "slug" | "title" | "pageType" | "status" | "version" | "updatedAt" | "publishedAt"
> {
  updatedBy: { displayName: string };
}
export interface PublicMediaItem {
  id: string;
  originalFilename: string;
  title: string;
  altText: string;
  caption: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  focalPointX: number;
  focalPointY: number;
  usageCount: number;
  status: "READY" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  uploadedBy?: string;
  variants: Record<
    string,
    { path: string; width: number; height: number; sizeBytes: number; mimeType: string }
  >;
}
export interface PublicMediaPage {
  items: PublicMediaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface PublicMediaUsage {
  items: Array<{
    pageKey: string;
    pageTitle: string;
    pageSlug: string;
    usage: string;
    sortOrder: number;
  }>;
}
export interface MarketingProjectOption {
  id: string;
  title: string;
  serviceKey: string;
  serviceAreaKey: string;
}
