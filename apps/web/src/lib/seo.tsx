import type { Metadata } from "next";
import {
  blogPostingStructuredData,
  brandedTitle,
  breadcrumbStructuredData,
  canonicalUrl,
  faqStructuredData,
  organizationStructuredData,
  serializeStructuredData,
  serviceStructuredData,
  websiteStructuredData,
  type BreadcrumbInput,
  type SchemaObject,
} from "@ctps/seo";

import { publicIndexingEnabled, site } from "@/content/site";

export interface MetadataOptions {
  readonly image?: {
    readonly url: string;
    readonly alt?: string;
    readonly width?: number;
    readonly height?: number;
  };
  readonly index?: boolean;
  readonly type?: "website" | "article";
}

export function metadataFor(
  title: string,
  description: string,
  path: string,
  options: MetadataOptions = {},
): Metadata {
  const canonical = canonicalUrl(site.url, path);
  const resolvedTitle = brandedTitle(title, site.name);
  const index = publicIndexingEnabled && options.index !== false;
  const image = options.image
    ? [{ ...options.image, url: canonicalUrl(site.url, options.image.url) }]
    : undefined;
  return {
    title: resolvedTitle,
    description,
    alternates: { canonical },
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, noimageindex: !index },
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: site.name,
      type: options.type ?? "website",
      images: image,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description,
      images: image?.map(({ url }) => url),
    },
  };
}

export function noIndexMetadata(title: string, description: string): Metadata {
  return {
    title: brandedTitle(title, site.name),
    description,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export function noIndexFollowMetadata(title: string, description: string): Metadata {
  return {
    title: brandedTitle(title, site.name),
    description,
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export function JsonLd({ data }: { readonly data: SchemaObject | readonly SchemaObject[] }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
      type="application/ld+json"
    />
  );
}

export function organizationSchema(settings?: {
  readonly businessDisplayName?: string;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly logoMediaId?: string | null;
  readonly socialProfiles?: Readonly<
    Partial<Record<"facebook" | "instagram" | "linkedin" | "youtube" | "x", string>>
  >;
}) {
  return organizationStructuredData({
    name: settings?.businessDisplayName || site.name,
    origin: site.url,
    ...(settings?.logoMediaId
      ? { logoUrl: canonicalUrl(site.url, `/media/marketing/${settings.logoMediaId}/original`) }
      : {}),
    ...(settings?.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings?.contactPhone ? { telephone: settings.contactPhone } : {}),
    ...(settings?.socialProfiles && Object.values(settings.socialProfiles).some(Boolean)
      ? {
          sameAs: Object.values(settings.socialProfiles).filter((value): value is string =>
            Boolean(value),
          ),
        }
      : {}),
  });
}

export function websiteSchema(businessDisplayName?: string) {
  return websiteStructuredData({ name: businessDisplayName || site.name, origin: site.url });
}

export function breadcrumbSchema(items: readonly BreadcrumbInput[]) {
  return breadcrumbStructuredData(site.url, items);
}

export function serviceSchema(input: {
  readonly name: string;
  readonly description: string;
  readonly path: string;
}) {
  return serviceStructuredData({ ...input, origin: site.url });
}

export function blogPostingSchema(
  input: Omit<Parameters<typeof blogPostingStructuredData>[0], "origin">,
) {
  return blogPostingStructuredData({ ...input, origin: site.url });
}

export function faqSchema(items: readonly { readonly title: string; readonly content: string }[]) {
  return faqStructuredData(items);
}
