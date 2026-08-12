import type { MarketingPageContent } from "@ctps/validation";

export interface SystemMarketingPage {
  readonly pageKey: string;
  readonly slug: string;
  readonly title: string;
  readonly navigationLabel?: string;
  readonly pageType: "LANDING" | "SERVICE" | "AREA";
  readonly content: MarketingPageContent;
}

const cta = { label: "Request a Quote", href: "/request-a-quote" } as const;
const areaItems = (
  [
    ["vancouver", "Vancouver"],
    ["richmond", "Richmond"],
    ["burnaby", "Burnaby"],
    ["surrey", "Surrey"],
    ["coquitlam", "Coquitlam"],
    ["north-vancouver", "North Vancouver"],
  ] as const
).map(([key, title]) => ({ key, title, href: `/service-areas/${key}` }));

const services = (
  [
    [
      "window-cleaning",
      "Window Cleaning",
      "Thoughtful window care for residential and commercial properties.",
    ],
    [
      "pressure-washing",
      "Pressure Washing",
      "Exterior cleaning assessed for surface, access, and drainage.",
    ],
    [
      "gutter-cleaning",
      "Gutter Cleaning",
      "Quote-based debris removal and downspout review for accessible properties.",
    ],
    [
      "moss-removal",
      "Moss Removal",
      "Careful moss assessment for roof and exterior property surfaces.",
    ],
    [
      "vent-cleaning",
      "Vent Cleaning",
      "Configurable residential and commercial vent-cleaning inquiries.",
    ],
  ] as const
).map(([key, title, body]) => ({ key, title, body, href: `/services/${key}` }));

export const homeContent: MarketingPageContent = {
  sections: [
    {
      id: "hero",
      type: "HERO_SLIDER",
      enabled: true,
      eyebrow: "Property care, considered clearly",
      title: "A cleaner exterior starts with a precise plan.",
      body: "Residential and commercial property-care inquiries across Vancouver and surrounding communities.",
      primaryCta: cta,
      secondaryCta: { label: "Explore the Estimator", href: "/estimate" },
      mediaIds: [],
      overlay: "BALANCED",
      autoplay: true,
      intervalMs: 7000,
    },
    {
      id: "trust",
      type: "TRUST_STRIP",
      enabled: true,
      title: "A clear property-care process",
      items: [
        {
          key: "residential-commercial",
          title: "Residential & Commercial",
          body: "Property-specific care",
        },
        {
          key: "lower-mainland",
          title: "Lower Mainland Service",
          body: "Six confirmed communities",
        },
        {
          key: "multiple-services",
          title: "Multiple Property-Care Services",
          body: "One clear inquiry path",
        },
        { key: "quote-based", title: "Quote-Based Service", body: "Reviewed before confirmation" },
      ],
      mediaIds: [],
      projectIds: [],
      postIds: [],
    },
    {
      id: "services",
      type: "SERVICE_SHOWCASE",
      enabled: true,
      eyebrow: "Services",
      title: "Property care without template thinking.",
      body: "Five service families presented with enough context to begin the right inquiry.",
      items: services,
      mediaIds: [],
      projectIds: [],
      postIds: [],
      primaryCta: { label: "Explore all services", href: "/services" },
    },
    {
      id: "featured-project",
      type: "FEATURED_PROJECT",
      enabled: true,
      eyebrow: "Selected transformation",
      title: "Published work, presented with clarity.",
      body: "Only published before-and-after projects can appear in this proof section.",
      items: [],
      mediaIds: [],
      projectIds: [],
      postIds: [],
      primaryCta: { label: "View Before & After", href: "/before-after" },
    },
    {
      id: "property-types",
      type: "RESIDENTIAL_COMMERCIAL",
      enabled: true,
      eyebrow: "Property types",
      title: "Residential detail. Commercial perspective.",
      body: "Different property contexts deserve distinct conversations and the same clear quote-based path.",
      items: [
        {
          key: "residential",
          title: "Residential",
          body: "Care shaped around homes, access, and requested service scope.",
          href: "/residential",
        },
        {
          key: "commercial",
          title: "Commercial",
          body: "A structured approach for storefronts, offices, and managed properties.",
          href: "/commercial",
        },
      ],
      mediaIds: [],
      projectIds: [],
      postIds: [],
    },
    {
      id: "standards",
      type: "VALUE_PROPOSITION",
      enabled: true,
      eyebrow: "Why CTPS",
      title: "Clarity is part of the service.",
      body: "The experience focuses on clear expectations and useful property information—not unsupported promises.",
      items: [
        { key: "communication", title: "Clear communication" },
        { key: "property-care", title: "Careful property treatment" },
        { key: "professional", title: "Professional service" },
        { key: "local", title: "Local service coverage" },
      ],
      mediaIds: [],
      projectIds: [],
      postIds: [],
    },
    {
      id: "process",
      type: "PROCESS",
      enabled: true,
      eyebrow: "How it works",
      title: "A considered path from inquiry to confirmed service.",
      items: [
        { key: "tell-us", title: "Tell us what you need" },
        { key: "estimate", title: "Receive a preliminary estimate where applicable" },
        { key: "review", title: "CTPS reviews your request" },
        { key: "schedule", title: "Service is scheduled after staff confirmation" },
      ],
      mediaIds: [],
      projectIds: [],
      postIds: [],
    },
    {
      id: "portfolio",
      type: "PROJECT_GRID",
      enabled: true,
      eyebrow: "Portfolio",
      title: "Selected property-care work.",
      items: [],
      mediaIds: [],
      projectIds: [],
      postIds: [],
      primaryCta: { label: "Explore the portfolio", href: "/before-after" },
    },
    {
      id: "areas",
      type: "SERVICE_AREAS",
      enabled: true,
      eyebrow: "Service areas",
      title: "Six confirmed British Columbia communities.",
      body: "Explore the six approved Lower Mainland service areas. Availability is confirmed during review.",
      items: areaItems,
      mediaIds: [],
      projectIds: [],
      postIds: [],
    },
    {
      id: "insights",
      type: "BLOG_PREVIEW",
      enabled: true,
      eyebrow: "Insights",
      title: "Practical property-care guidance.",
      items: [],
      mediaIds: [],
      projectIds: [],
      postIds: [],
      primaryCta: { label: "View insights", href: "/blog" },
    },
    {
      id: "final-cta",
      type: "FINAL_CTA",
      enabled: true,
      eyebrow: "A clear next step",
      title: "Ready to describe the property?",
      body: "Share the property context and CTPS can review the request before confirming scope or pricing.",
      items: [],
      mediaIds: [],
      projectIds: [],
      postIds: [],
      primaryCta: cta,
      secondaryCta: { label: "Contact CTPS", href: "/contact" },
    },
  ],
};

function landing(
  pageKey: string,
  slug: string,
  title: string,
  summary: string,
): SystemMarketingPage {
  return {
    pageKey,
    slug,
    title,
    navigationLabel: title,
    pageType: "LANDING",
    content: {
      sections: [
        {
          id: "hero",
          type: "HERO_SLIDER",
          enabled: true,
          eyebrow: "CTPS Property Care",
          title,
          body: summary,
          primaryCta: cta,
          secondaryCta: { label: "Explore Services", href: "/services" },
          mediaIds: [],
          overlay: "BALANCED",
          autoplay: false,
          intervalMs: 7000,
        },
        {
          id: "content",
          type: "RICH_TEXT",
          enabled: true,
          title,
          body: summary,
          items: [],
          mediaIds: [],
          projectIds: [],
          postIds: [],
        },
        {
          id: "final-cta",
          type: "FINAL_CTA",
          enabled: true,
          title: "Start with a clear request.",
          body: "CTPS reviews the submitted details before confirming scope, pricing, or scheduling.",
          items: [],
          mediaIds: [],
          projectIds: [],
          postIds: [],
          primaryCta: cta,
        },
      ],
    },
  };
}

const servicePages = services.map((service) => ({
  pageKey: `SERVICE_${service.key.replaceAll("-", "_").toUpperCase()}`,
  slug: `/services/${service.key}`,
  title: service.title,
  navigationLabel: service.title,
  pageType: "SERVICE" as const,
  content: landing("", "", service.title, service.body ?? "Quote-based CTPS property care.")
    .content,
}));
const areaPages = areaItems.map((area) => ({
  pageKey: `AREA_${area.key.replaceAll("-", "_").toUpperCase()}`,
  slug: `/service-areas/${area.key}`,
  title: area.title,
  navigationLabel: area.title,
  pageType: "AREA" as const,
  content: landing(
    "",
    "",
    `${area.title} property care`,
    `CTPS reviews residential and commercial service inquiries in ${area.title}, British Columbia.`,
  ).content,
}));

export const systemMarketingPages: readonly SystemMarketingPage[] = [
  {
    pageKey: "HOME",
    slug: "/",
    title: "Homepage",
    navigationLabel: "Home",
    pageType: "LANDING",
    content: homeContent,
  },
  landing(
    "SERVICES",
    "/services",
    "Services",
    "Explore the five CTPS property-care service families.",
  ),
  landing(
    "ABOUT",
    "/about",
    "About CTPS",
    "A clear, professional approach to residential and commercial property care.",
  ),
  landing(
    "CONTACT",
    "/contact",
    "Contact CTPS",
    "Use Contact for general inquiries and Request a Quote for property-specific service requests.",
  ),
  landing(
    "RESIDENTIAL",
    "/residential",
    "Residential property care",
    "Property-care inquiries shaped around homes, access, and requested scope.",
  ),
  landing(
    "COMMERCIAL",
    "/commercial",
    "Commercial property care",
    "A structured property-care approach for commercial and managed spaces.",
  ),
  {
    ...landing(
      "SERVICE_AREAS",
      "/service-areas",
      "Service areas",
      "CTPS accepts inquiries in six confirmed British Columbia communities.",
    ),
    content: {
      sections: [
        {
          id: "hero",
          type: "HERO_SLIDER",
          enabled: true,
          eyebrow: "British Columbia",
          title: "Service areas",
          body: "CTPS accepts inquiries in six confirmed British Columbia communities.",
          primaryCta: cta,
          mediaIds: [],
          overlay: "BALANCED",
          autoplay: false,
          intervalMs: 7000,
        },
        {
          id: "areas",
          type: "SERVICE_AREAS",
          enabled: true,
          title: "Confirmed service areas",
          items: areaItems,
          mediaIds: [],
          projectIds: [],
          postIds: [],
        },
      ],
    },
  },
  ...servicePages,
  ...areaPages,
];

export const systemNavigation = [
  ["SERVICES", "Services", "/services"],
  ["RESIDENTIAL", "Residential", "/residential"],
  ["COMMERCIAL", "Commercial", "/commercial"],
  ["BEFORE_AFTER", "Before & After", "/before-after"],
  ["SERVICE_AREAS", "Service Areas", "/service-areas"],
  ["ABOUT", "About", "/about"],
  ["BLOG", "Blog", "/blog"],
  ["CONTACT", "Contact", "/contact"],
] as const;
