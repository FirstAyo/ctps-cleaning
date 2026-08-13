export const CTPS_SERVICE_AREA_KEYS = [
  "vancouver",
  "richmond",
  "burnaby",
  "surrey",
  "coquitlam",
  "north-vancouver",
] as const;

export const CTPS_SERVICE_AREA_NAMES = [
  "Vancouver",
  "Richmond",
  "Burnaby",
  "Surrey",
  "Coquitlam",
  "North Vancouver",
] as const;

export const CTPS_SERVICE_KEYS = [
  "window-cleaning",
  "pressure-washing",
  "gutter-cleaning",
  "moss-removal",
  "vent-cleaning",
] as const;

export type Indexability = "INDEX" | "NOINDEX";
export type SeoRouteKind =
  | "MARKETING"
  | "SERVICE"
  | "SERVICE_AREA"
  | "PROJECT"
  | "BLOG"
  | "BLOG_TAXONOMY"
  | "TRANSACTIONAL"
  | "PRIVATE"
  | "TECHNICAL";

export interface RouteIndexabilityRule {
  readonly route: string;
  readonly kind: SeoRouteKind;
  readonly indexability: Indexability;
  readonly follow: boolean;
  readonly sitemap: boolean;
  readonly authentication: "PUBLIC" | "STAFF" | "TOKEN" | "INTERNAL";
  readonly canonical: "SELF" | "NONE" | "DERIVED_CURRENT_SLUG";
  readonly structuredData: readonly string[];
}

export const ROUTE_INDEXABILITY_MATRIX: readonly RouteIndexabilityRule[] = [
  {
    route: "/",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: ["Organization", "WebSite"],
  },
  {
    route: "/services",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/services/{service}",
    kind: "SERVICE",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "DERIVED_CURRENT_SLUG",
    structuredData: ["Service", "BreadcrumbList"],
  },
  {
    route: "/residential",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/commercial",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/service-areas",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/service-areas/{area}",
    kind: "SERVICE_AREA",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "DERIVED_CURRENT_SLUG",
    structuredData: ["BreadcrumbList"],
  },
  {
    route: "/about",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/contact",
    kind: "MARKETING",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/before-after",
    kind: "PROJECT",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/before-after/{published-project}",
    kind: "PROJECT",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "DERIVED_CURRENT_SLUG",
    structuredData: ["BreadcrumbList"],
  },
  {
    route: "/blog",
    kind: "BLOG",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/blog?query|category|tag|page",
    kind: "BLOG_TAXONOMY",
    indexability: "NOINDEX",
    follow: true,
    sitemap: false,
    authentication: "PUBLIC",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/blog/{published-post}",
    kind: "BLOG",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "DERIVED_CURRENT_SLUG",
    structuredData: ["BlogPosting", "BreadcrumbList"],
  },
  {
    route: "/blog/category/{slug}",
    kind: "BLOG_TAXONOMY",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "DERIVED_CURRENT_SLUG",
    structuredData: ["BreadcrumbList"],
  },
  {
    route: "/blog/tag/{slug}",
    kind: "BLOG_TAXONOMY",
    indexability: "NOINDEX",
    follow: true,
    sitemap: false,
    authentication: "PUBLIC",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/blog/author/{slug}",
    kind: "BLOG_TAXONOMY",
    indexability: "NOINDEX",
    follow: true,
    sitemap: false,
    authentication: "PUBLIC",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/request-a-quote",
    kind: "TRANSACTIONAL",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/estimate",
    kind: "TRANSACTIONAL",
    indexability: "INDEX",
    follow: true,
    sitemap: true,
    authentication: "PUBLIC",
    canonical: "SELF",
    structuredData: [],
  },
  {
    route: "/request-a-quote/confirmation",
    kind: "PRIVATE",
    indexability: "NOINDEX",
    follow: false,
    sitemap: false,
    authentication: "TOKEN",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/estimate/results/{token}",
    kind: "PRIVATE",
    indexability: "NOINDEX",
    follow: false,
    sitemap: false,
    authentication: "TOKEN",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/admin/**",
    kind: "PRIVATE",
    indexability: "NOINDEX",
    follow: false,
    sitemap: false,
    authentication: "STAFF",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/preview/**",
    kind: "PRIVATE",
    indexability: "NOINDEX",
    follow: false,
    sitemap: false,
    authentication: "STAFF",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/api/**|/health/**|/media/private/**",
    kind: "TECHNICAL",
    indexability: "NOINDEX",
    follow: false,
    sitemap: false,
    authentication: "INTERNAL",
    canonical: "NONE",
    structuredData: [],
  },
  {
    route: "/design-system",
    kind: "TECHNICAL",
    indexability: "NOINDEX",
    follow: false,
    sitemap: false,
    authentication: "PUBLIC",
    canonical: "NONE",
    structuredData: [],
  },
] as const;

function requireHttpOrigin(value: string): URL {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error(
      "The public site origin must be an HTTP(S) origin without credentials, path, query, or fragment.",
    );
  url.pathname = "/";
  return url;
}

export function normalizeSiteOrigin(value: string): string {
  return requireHttpOrigin(value).origin;
}

export function assertProductionSiteOrigin(value: string): string {
  const origin = requireHttpOrigin(value);
  if (origin.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(origin.hostname))
    throw new Error("Production public site origin must use HTTPS and cannot use a loopback host.");
  return origin.origin;
}

export function normalizePublicPath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  const normalized = `/${pathname}`.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  if (normalized !== normalized.toLowerCase())
    throw new Error("Canonical public paths must be lowercase.");
  return normalized;
}

export function canonicalUrl(origin: string, path: string): string {
  return new URL(normalizePublicPath(path), `${normalizeSiteOrigin(origin)}/`).toString();
}

export function brandedTitle(title: string, brand = "CTPS"): string {
  const cleanTitle = title.trim();
  const cleanBrand = brand.trim();
  return cleanTitle.toLocaleLowerCase().endsWith(`| ${cleanBrand}`.toLocaleLowerCase())
    ? cleanTitle
    : `${cleanTitle} | ${cleanBrand}`;
}

export interface BreadcrumbInput {
  readonly name: string;
  readonly path: string;
}

type SchemaValue = string | number | boolean | SchemaObject | readonly SchemaValue[];
export interface SchemaObject {
  readonly [key: string]: SchemaValue | undefined;
}

function compact(value: SchemaValue | undefined): SchemaValue | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value))
    return value.map((item) => compact(item)).filter((item) => item !== undefined) as SchemaValue[];
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter((entry): entry is readonly [string, SchemaValue] => entry[1] !== undefined);
    return Object.fromEntries(entries) as SchemaObject;
  }
  return value;
}

export function organizationStructuredData(input: {
  readonly name: string;
  readonly origin: string;
  readonly logoUrl?: string;
  readonly email?: string;
  readonly telephone?: string;
  readonly sameAs?: readonly string[];
}): SchemaObject {
  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${normalizeSiteOrigin(input.origin)}/#organization`,
    name: input.name,
    url: canonicalUrl(input.origin, "/"),
    logo: input.logoUrl,
    email: input.email,
    telephone: input.telephone,
    sameAs: input.sameAs?.length ? input.sameAs : undefined,
    areaServed: CTPS_SERVICE_AREA_NAMES.map((name) => ({ "@type": "City", name })),
  }) as SchemaObject;
}

export function websiteStructuredData(input: {
  readonly name: string;
  readonly origin: string;
}): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${normalizeSiteOrigin(input.origin)}/#website`,
    name: input.name,
    url: canonicalUrl(input.origin, "/"),
    publisher: { "@id": `${normalizeSiteOrigin(input.origin)}/#organization` },
  };
}

export function serviceStructuredData(input: {
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly origin: string;
}): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: canonicalUrl(input.origin, input.path),
    provider: { "@id": `${normalizeSiteOrigin(input.origin)}/#organization` },
    areaServed: CTPS_SERVICE_AREA_NAMES.map((name) => ({ "@type": "City", name })),
  };
}

export function breadcrumbStructuredData(
  origin: string,
  items: readonly BreadcrumbInput[],
): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(origin, item.path),
    })),
  };
}

export function blogPostingStructuredData(input: {
  readonly headline: string;
  readonly description: string;
  readonly path: string;
  readonly origin: string;
  readonly authorName: string;
  readonly authorPath?: string;
  readonly datePublished: string;
  readonly dateModified: string;
  readonly imageUrl?: string;
}): SchemaObject {
  return compact({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: canonicalUrl(input.origin, input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    image: input.imageUrl,
    author: {
      "@type": "Person",
      name: input.authorName,
      url: input.authorPath ? canonicalUrl(input.origin, input.authorPath) : undefined,
    },
    publisher: { "@id": `${normalizeSiteOrigin(input.origin)}/#organization` },
  }) as SchemaObject;
}

export function faqStructuredData(
  items: readonly { readonly title: string; readonly content: string }[],
): SchemaObject {
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

export function serializeStructuredData(data: SchemaObject | readonly SchemaObject[]): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function normalizeAuditText(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function extractInternalLinks(value: unknown): string[] {
  const links = new Set<string>();
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) return void item.forEach(visit);
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      if (key === "href" && typeof child === "string" && child.startsWith("/")) {
        try {
          links.add(normalizePublicPath(child));
        } catch {
          links.add(child.split(/[?#]/, 1)[0]?.replace(/\/$/, "") || "/");
        }
      } else visit(child);
    }
  };
  visit(value);
  return [...links].sort();
}
