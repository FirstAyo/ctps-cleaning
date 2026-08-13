import "server-only";
import type { Metadata } from "next";
import { brandedTitle } from "@ctps/seo";

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
export interface PublishedMarketingPage {
  pageKey: string;
  slug: string;
  title: string;
  publishedContent: { sections: MarketingSection[] };
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  socialImageId: string | null;
  publishedAt: string;
  media: Array<{ id: string; altText: string; focalPointX: number; focalPointY: number }>;
}

function apiUrl(path: string) {
  const base = process.env.API_URL;
  if (!base) throw new Error("API URL unavailable");
  return new URL(path, base.endsWith("/") ? base : `${base}/`);
}
export async function getMarketingPage(pageKey: string): Promise<PublishedMarketingPage | null> {
  try {
    const response = await fetch(apiUrl(`public/pages/${encodeURIComponent(pageKey)}`), {
      next: { revalidate: 60, tags: [`marketing:${pageKey}`] },
    });
    if (!response.ok) return null;
    return (await response.json()) as PublishedMarketingPage;
  } catch {
    return null;
  }
}
export async function getPublicNavigation() {
  try {
    const response = await fetch(apiUrl("public/navigation"), {
      next: { revalidate: 60, tags: ["marketing:navigation"] },
    });
    return response.ok
      ? ((await response.json()) as { items: Array<{ label: string; href: string }> })
      : null;
  } catch {
    return null;
  }
}
export async function getSiteSettings() {
  try {
    const response = await fetch(apiUrl("public/site-settings"), {
      next: { revalidate: 60, tags: ["marketing:settings"] },
    });
    return response.ok ? ((await response.json()) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export async function getMarketingMetadata(pageKey: string, fallback: Metadata): Promise<Metadata> {
  const page = await getMarketingPage(pageKey);
  if (!page) return fallback;
  const image = page.socialImageId ? `/media/marketing/${page.socialImageId}/large` : undefined;
  const metadataTitle = brandedTitle(page.seoTitle ?? page.title);
  const socialTitle = brandedTitle(page.ogTitle ?? page.seoTitle ?? page.title);
  const description =
    page.ogDescription ?? page.seoDescription ?? fallback.description ?? undefined;
  return {
    ...fallback,
    title: metadataTitle,
    description: page.seoDescription ?? fallback.description,
    openGraph: {
      ...(typeof fallback.openGraph === "object" ? fallback.openGraph : {}),
      title: socialTitle,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      ...(typeof fallback.twitter === "object" ? fallback.twitter : {}),
      title: socialTitle,
      description,
      ...(image ? { card: "summary_large_image", images: [image] } : {}),
    },
  };
}
