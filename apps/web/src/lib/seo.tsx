import type { Metadata } from "next";

import { site } from "@/content/site";

export function metadataFor(title: string, description: string, path: string): Metadata {
  const canonical = new URL(path, site.url).toString();
  return {
    title: `${title} | CTPS`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | CTPS`,
      description,
      url: canonical,
      siteName: site.name,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${title} | CTPS`, description },
  };
}

export function JsonLd({
  data,
}: {
  readonly data: Record<string, unknown> | readonly Record<string, unknown>[];
}) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", "\\u003c") }}
      type="application/ld+json"
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  areaServed: ["Vancouver", "Richmond", "Burnaby", "Surrey", "Coquitlam", "North Vancouver"],
};

export function breadcrumbSchema(
  items: readonly { readonly name: string; readonly path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, site.url).toString(),
    })),
  };
}

export function faqSchema(items: readonly { readonly title: string; readonly content: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: { "@type": "Answer", text: item.content },
    })),
  };
}
