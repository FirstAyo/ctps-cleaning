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

const processItems = [
  {
    key: "request",
    title: "Share the property context",
    body: "Choose the relevant services and describe the property, access, and priorities.",
  },
  {
    key: "review",
    title: "CTPS reviews the request",
    body: "The submitted details are reviewed before scope, pricing, or availability is confirmed.",
  },
  {
    key: "follow-up",
    title: "Confirm the next step",
    body: "CTPS follows up to clarify the work and arrange service when both sides are ready.",
  },
] as const;
const faqItems = [
  {
    key: "booking",
    title: "Does an inquiry create a booking?",
    body: "No. A request begins a review and follow-up conversation; it does not reserve an appointment.",
  },
  {
    key: "areas",
    title: "Where does CTPS accept inquiries?",
    body: "Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver are the currently approved service areas.",
  },
] as const;

function hero(title: string, body: string, eyebrow: string) {
  return {
    id: "hero",
    type: "HERO_SLIDER" as const,
    enabled: true,
    eyebrow,
    title,
    body,
    primaryCta: cta,
    secondaryCta: { label: "Explore Services", href: "/services" },
    mediaIds: [],
    overlay: "BALANCED" as const,
    autoplay: false,
    intervalMs: 7000 as const,
  };
}

function standard(
  id: string,
  type: Exclude<MarketingPageContent["sections"][number]["type"], "HERO_SLIDER">,
  title: string,
  body?: string,
  items: Array<{ key: string; title: string; body?: string; href?: string }> = [],
) {
  return {
    id,
    type,
    enabled: true,
    title,
    ...(body ? { body } : {}),
    items,
    mediaIds: [],
    projectIds: [],
    postIds: [],
  };
}

function finalCta(title: string, body: string) {
  return {
    ...standard("final-cta", "FINAL_CTA", title, body),
    eyebrow: "A clear next step",
    primaryCta: cta,
    secondaryCta: { label: "Contact CTPS", href: "/contact" },
  };
}

function serviceDetailContent(
  service: (typeof services)[number],
  index: number,
): MarketingPageContent {
  const related = services
    .filter((item) => item.key !== service.key)
    .slice(index % 2, (index % 2) + 3)
    .map(({ key, title, body, href }) => ({ key, title, body, href }));
  return {
    sections: [
      hero(service.title, service.body ?? "Quote-based CTPS property care.", service.title),
      {
        ...standard(
          "positioning",
          "RICH_TEXT",
          `${service.title}, considered for the property.`,
          "CTPS begins with the requested outcome, property context, surface or system condition, and safe access before confirming an approach.",
        ),
        eyebrow: "Service perspective",
      },
      {
        ...standard(
          "explanation",
          "MEDIA_TEXT",
          "A clear assessment before assumptions.",
          service.body,
        ),
        eyebrow: "How CTPS approaches it",
      },
      {
        ...standard(
          "inclusions",
          "VALUE_PROPOSITION",
          "What may be included",
          "Final inclusions depend on the reviewed request and agreed quote.",
          [
            {
              key: "property",
              title: "Property-specific review",
              body: "Scope is shaped around the site and requested work.",
            },
            {
              key: "access",
              title: "Access considerations",
              body: "Relevant access details are reviewed before confirmation.",
            },
            {
              key: "scope",
              title: "Agreed service scope",
              body: "Only the work confirmed in the quote is represented as included.",
            },
          ],
        ),
        eyebrow: "Service scope",
      },
      {
        ...standard(
          "property-types",
          "RESIDENTIAL_COMMERCIAL",
          "Residential and commercial relevance",
          "The same service category can require a different conversation for a home, storefront, office, or managed property.",
          [
            {
              key: "residential",
              title: "Residential",
              body: "Home-focused inquiries with property and access context.",
              href: "/residential",
            },
            {
              key: "commercial",
              title: "Commercial",
              body: "Structured inquiries for commercial and managed spaces.",
              href: "/commercial",
            },
          ],
        ),
        eyebrow: "Property contexts",
      },
      {
        ...standard(
          "project-proof",
          "FEATURED_PROJECT",
          "Selected published work",
          "Relevant proof appears only when an approved Published project is selected.",
        ),
        eyebrow: "Before & After",
      },
      {
        ...standard("process", "PROCESS", "From inquiry to confirmed scope", undefined, [
          ...processItems,
        ]),
        eyebrow: "Process",
      },
      {
        ...standard(
          "areas",
          "SERVICE_AREAS",
          "Available across six approved communities",
          "Availability is confirmed after CTPS reviews the request.",
          areaItems,
        ),
        eyebrow: "Service areas",
      },
      {
        ...standard("faq", "FAQ", `${service.title} questions`, undefined, [...faqItems]),
        eyebrow: "Guidance",
      },
      {
        ...standard(
          "related",
          "RELATED_SERVICES",
          "Related property-care services",
          undefined,
          related,
        ),
        eyebrow: "Continue exploring",
      },
      finalCta(
        `Discuss ${service.title.toLowerCase()} for your property.`,
        "Share the property context and CTPS can review the appropriate next step.",
      ),
    ],
  };
}

function areaDetailContent(area: (typeof areaItems)[number]): MarketingPageContent {
  return {
    sections: [
      hero(
        `${area.title} property care`,
        `CTPS reviews residential and commercial service inquiries in ${area.title}, British Columbia.`,
        area.title,
      ),
      {
        ...standard(
          "local-intro",
          "MEDIA_TEXT",
          `A considered service conversation for ${area.title}.`,
          "Property type, requested services, access, and current conditions inform every review. No booking or availability is implied until CTPS confirms it.",
        ),
        eyebrow: "Local context",
      },
      {
        ...standard(
          "available-services",
          "SERVICE_SHOWCASE",
          `Services available for ${area.title} inquiries`,
          "Explore the five CTPS service families and request only what is relevant to the property.",
          services,
        ),
        eyebrow: "Property care",
      },
      {
        ...standard(
          "project-proof",
          "FEATURED_PROJECT",
          `Selected work relevant to ${area.title}`,
          "Only an explicitly selected Published project is shown.",
        ),
        eyebrow: "Project proof",
      },
      {
        ...standard(
          "property-types",
          "RESIDENTIAL_COMMERCIAL",
          "Homes and commercial properties",
          "CTPS keeps residential and commercial property contexts distinct during review.",
          [
            { key: "residential", title: "Residential", href: "/residential" },
            { key: "commercial", title: "Commercial", href: "/commercial" },
          ],
        ),
        eyebrow: "Property contexts",
      },
      {
        ...standard("process", "PROCESS", "A clear request and review process", undefined, [
          ...processItems,
        ]),
        eyebrow: "How it works",
      },
      {
        ...standard("faq", "FAQ", `${area.title} service questions`, undefined, [...faqItems]),
        eyebrow: "Guidance",
      },
      {
        ...standard(
          "nearby",
          "SERVICE_AREAS",
          "Explore other approved service areas",
          undefined,
          areaItems.filter((item) => item.key !== area.key),
        ),
        eyebrow: "Nearby coverage",
      },
      finalCta(
        `Planning property care in ${area.title}?`,
        "Tell CTPS what the property needs and the team can review the request.",
      ),
    ],
  };
}

const servicePages = services.map((service, index) => ({
  pageKey: `SERVICE_${service.key.replaceAll("-", "_").toUpperCase()}`,
  slug: `/services/${service.key}`,
  title: service.title,
  navigationLabel: service.title,
  pageType: "SERVICE" as const,
  content: serviceDetailContent(service, index),
}));
const areaPages = areaItems.map((area) => ({
  pageKey: `AREA_${area.key.replaceAll("-", "_").toUpperCase()}`,
  slug: `/service-areas/${area.key}`,
  title: area.title,
  navigationLabel: area.title,
  pageType: "AREA" as const,
  content: areaDetailContent(area),
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
  {
    pageKey: "SERVICES",
    slug: "/services",
    title: "Services",
    navigationLabel: "Services",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Property care shaped around the site.",
          "Explore five CTPS service families for residential and commercial properties.",
          "Services",
        ),
        {
          ...standard(
            "philosophy",
            "RICH_TEXT",
            "Start with the property, not a template.",
            "CTPS reviews the requested outcome, property context, access, and relevant conditions before confirming service scope.",
          ),
          eyebrow: "Service philosophy",
        },
        {
          ...standard(
            "service-catalogue",
            "SERVICE_SHOWCASE",
            "Five services. One considered inquiry path.",
            "Explore each service through an image-led overview, then share the details relevant to your property.",
            services,
          ),
          eyebrow: "Service catalogue",
          primaryCta: cta,
        },
        {
          ...standard(
            "property-types",
            "RESIDENTIAL_COMMERCIAL",
            "Different properties deserve distinct conversations.",
            "Residential and commercial work share a clear review process without being treated as identical.",
            [
              {
                key: "residential",
                title: "Residential",
                body: "Property care centered on homes and residential access.",
                href: "/residential",
              },
              {
                key: "commercial",
                title: "Commercial",
                body: "A structured approach for commercial and managed spaces.",
                href: "/commercial",
              },
            ],
          ),
          eyebrow: "Property contexts",
        },
        {
          ...standard(
            "process",
            "PROCESS",
            "A clear path from request to confirmed service",
            undefined,
            [...processItems],
          ),
          eyebrow: "How CTPS works",
        },
        {
          ...standard(
            "project-proof",
            "FEATURED_PROJECT",
            "Selected transformations",
            "Published project proof appears only when approved work is selected.",
          ),
          eyebrow: "Before & After",
        },
        {
          ...standard(
            "areas",
            "SERVICE_AREAS",
            "Six approved British Columbia communities",
            "Explore current service-area pages and confirm availability during review.",
            areaItems,
          ),
          eyebrow: "Service areas",
        },
        {
          ...standard("faq", "FAQ", "Service-request guidance", undefined, [...faqItems]),
          eyebrow: "Questions",
        },
        finalCta(
          "Bring the property details into focus.",
          "Tell CTPS which services you are considering and the team can review the request.",
        ),
      ],
    },
  },
  {
    pageKey: "ABOUT",
    slug: "/about",
    title: "About CTPS",
    navigationLabel: "About",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Property care with clarity at its centre.",
          "CTPS presents a measured, professional approach to residential and commercial property-care inquiries.",
          "About CTPS",
        ),
        {
          ...standard(
            "philosophy",
            "MEDIA_TEXT",
            "Useful information before a commitment.",
            "CTPS begins with the property, requested service, and relevant access details, then reviews the request before confirming scope or pricing.",
          ),
          eyebrow: "Our philosophy",
        },
        {
          ...standard(
            "approach",
            "RICH_TEXT",
            "A calm, property-specific approach.",
            "The service experience is designed around clear expectations, careful review, and an honest distinction between an inquiry and confirmed work.",
          ),
          eyebrow: "Service approach",
        },
        {
          ...standard(
            "principles",
            "VALUE_PROPOSITION",
            "Principles that guide the experience",
            undefined,
            [
              {
                key: "clarity",
                title: "Clarity",
                body: "Explain the request, review, and next step without unsupported promises.",
              },
              {
                key: "context",
                title: "Property context",
                body: "Consider the site, access, conditions, and requested outcome.",
              },
              {
                key: "care",
                title: "Considered care",
                body: "Confirm an appropriate scope before representing work as agreed.",
              },
              {
                key: "privacy",
                title: "Respect for privacy",
                body: "Keep customer information and private uploads outside public marketing systems.",
              },
            ],
          ),
          eyebrow: "What matters",
        },
        {
          ...standard(
            "property-types",
            "RESIDENTIAL_COMMERCIAL",
            "Residential detail. Commercial perspective.",
            "Different property contexts follow distinct editorial paths and the same transparent review boundary.",
            [
              { key: "residential", title: "Residential", href: "/residential" },
              { key: "commercial", title: "Commercial", href: "/commercial" },
            ],
          ),
          eyebrow: "Property perspectives",
        },
        {
          ...standard(
            "project-proof",
            "FEATURED_PROJECT",
            "Selected published work",
            "Approved project proof can be selected without inventing company history or statistics.",
          ),
          eyebrow: "Project proof",
        },
        {
          ...standard(
            "areas",
            "SERVICE_AREAS",
            "Serving six approved communities",
            undefined,
            areaItems,
          ),
          eyebrow: "Areas served",
        },
        finalCta(
          "Start with a clear property-care request.",
          "Share what the property needs and CTPS can review the next step.",
        ),
      ],
    },
  },
  {
    pageKey: "CONTACT",
    slug: "/contact",
    title: "Contact CTPS",
    navigationLabel: "Contact",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Two clear ways to reach CTPS.",
          "Use Contact for a general inquiry. Use Request a Quote when you want CTPS to review a property-specific service request.",
          "Contact",
        ),
        {
          ...standard(
            "contact-intro",
            "CONTACT",
            "General inquiries belong here.",
            "Contact details appear only when configured. Property-specific work should begin through the private quote-request workflow.",
          ),
          eyebrow: "General contact",
        },
        {
          ...standard(
            "quote-path",
            "MEDIA_TEXT",
            "Requesting property-care service?",
            "The quote request gathers service, property, contact, timing, and optional private photo details for review.",
            [
              {
                key: "quote",
                title: "Request a Quote",
                body: "Share property-specific details securely.",
                href: "/request-a-quote",
              },
            ],
          ),
          eyebrow: "A separate path",
        },
        {
          ...standard("areas", "SERVICE_AREAS", "Current service areas", undefined, areaItems),
          eyebrow: "Coverage",
        },
        {
          ...standard("next", "PROCESS", "What happens next", undefined, [...processItems]),
          eyebrow: "After you reach out",
        },
        finalCta(
          "Have a property-specific request?",
          "Use the dedicated quote workflow so CTPS receives the details needed for review.",
        ),
      ],
    },
  },
  {
    pageKey: "RESIDENTIAL",
    slug: "/residential",
    title: "Residential property care",
    navigationLabel: "Residential",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Care for the details that shape a home.",
          "Residential property-care inquiries centered on the home, access, condition, and requested scope.",
          "Residential",
        ),
        {
          ...standard(
            "positioning",
            "MEDIA_TEXT",
            "Begin with how the property is lived in.",
            "CTPS reviews the requested work in the context of a home, from access and exterior surfaces to the practical details shared in the inquiry.",
          ),
          eyebrow: "Home care",
        },
        {
          ...standard(
            "services",
            "SERVICE_SHOWCASE",
            "Residential services to explore",
            undefined,
            services,
          ),
          eyebrow: "Relevant services",
        },
        {
          ...standard(
            "editorial-media",
            "MEDIA_TEXT",
            "Photography that reflects the property context.",
            "Supporting imagery remains controlled by the Public Media Library and can be replaced without changing the layout.",
          ),
          eyebrow: "A closer view",
        },
        {
          ...standard(
            "project-proof",
            "FEATURED_PROJECT",
            "Selected residential work",
            "This section stays hidden until an appropriate Published project is selected.",
          ),
          eyebrow: "Before & After",
        },
        {
          ...standard("process", "PROCESS", "A considered residential request", undefined, [
            ...processItems,
          ]),
          eyebrow: "Process",
        },
        {
          ...standard("why", "VALUE_PROPOSITION", "Why clarity matters at home", undefined, [
            {
              key: "scope",
              title: "Clear scope",
              body: "Requested services are reviewed before they are confirmed.",
            },
            {
              key: "access",
              title: "Access context",
              body: "Property access can be described early in the inquiry.",
            },
            {
              key: "privacy",
              title: "Private property details",
              body: "Quote photos and customer information remain private.",
            },
          ]),
          eyebrow: "Residential perspective",
        },
        {
          ...standard(
            "areas",
            "SERVICE_AREAS",
            "Residential inquiries across six communities",
            undefined,
            areaItems,
          ),
          eyebrow: "Service areas",
        },
        {
          ...standard("faq", "FAQ", "Residential service questions", undefined, [...faqItems]),
          eyebrow: "Guidance",
        },
        finalCta(
          "Describe what your home needs.",
          "Select the relevant services and share enough property context for CTPS to review.",
        ),
      ],
    },
  },
  {
    pageKey: "COMMERCIAL",
    slug: "/commercial",
    title: "Commercial property care",
    navigationLabel: "Commercial",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Property care with a more structured view.",
          "Commercial and managed-property inquiries organized around the site, requested services, access, and operating context.",
          "Commercial",
        ),
        {
          ...standard(
            "positioning",
            "MEDIA_TEXT",
            "A clear brief for a commercial property.",
            "CTPS reviews the site and requested work without implying contract terms, response commitments, certifications, or service levels that have not been approved.",
          ),
          eyebrow: "Commercial perspective",
        },
        {
          ...standard(
            "services",
            "SERVICE_SHOWCASE",
            "Commercial services to consider",
            undefined,
            services,
          ),
          eyebrow: "Relevant services",
        },
        {
          ...standard(
            "operations",
            "VALUE_PROPOSITION",
            "A disciplined inquiry process",
            undefined,
            [
              {
                key: "site",
                title: "Site context",
                body: "Describe the type of commercial or managed property.",
              },
              {
                key: "scope",
                title: "Requested scope",
                body: "Identify relevant services without assuming availability.",
              },
              {
                key: "review",
                title: "Staff review",
                body: "CTPS confirms the next step after reviewing the request.",
              },
            ],
          ),
          eyebrow: "Operational approach",
        },
        {
          ...standard(
            "editorial-media",
            "MEDIA_TEXT",
            "A closer view of the property context.",
            "Supporting media remains editable through the Public Media Library.",
          ),
          eyebrow: "Property detail",
        },
        {
          ...standard(
            "project-proof",
            "FEATURED_PROJECT",
            "Selected commercial work",
            "This section remains hidden until approved Published project proof is selected.",
          ),
          eyebrow: "Project proof",
        },
        {
          ...standard("process", "PROCESS", "From brief to confirmed next step", undefined, [
            ...processItems,
          ]),
          eyebrow: "Process",
        },
        {
          ...standard(
            "areas",
            "SERVICE_AREAS",
            "Commercial inquiries across six communities",
            undefined,
            areaItems,
          ),
          eyebrow: "Areas served",
        },
        {
          ...standard("faq", "FAQ", "Commercial service questions", undefined, [...faqItems]),
          eyebrow: "Guidance",
        },
        finalCta(
          "Share the commercial property context.",
          "CTPS can review the requested services and respond with an appropriate next step.",
        ),
      ],
    },
  },
  {
    ...landing(
      "SERVICE_AREAS",
      "/service-areas",
      "Service areas",
      "CTPS accepts inquiries in six confirmed British Columbia communities.",
    ),
    content: {
      sections: [
        hero(
          "Six communities. One clear inquiry path.",
          "CTPS accepts residential and commercial property-care inquiries across six approved British Columbia communities.",
          "Service areas",
        ),
        {
          ...standard(
            "introduction",
            "RICH_TEXT",
            "Coverage presented without invented boundaries.",
            "Choose a community to explore the CTPS services available for inquiry. Final availability is confirmed only after the property request is reviewed.",
          ),
          eyebrow: "British Columbia",
        },
        {
          ...standard(
            "areas",
            "SERVICE_AREAS",
            "Explore the approved service areas",
            undefined,
            areaItems,
          ),
          eyebrow: "Area directory",
        },
        {
          ...standard(
            "coverage",
            "MEDIA_TEXT",
            "Property context matters as much as the city name.",
            "Service, property type, access, and current conditions all help CTPS understand a request. No unsupported neighbourhood or response-time claims are added.",
          ),
          eyebrow: "Service coverage",
        },
        {
          ...standard(
            "services",
            "RELATED_SERVICES",
            "Featured property-care services",
            undefined,
            services.slice(0, 3),
          ),
          eyebrow: "Explore services",
        },
        {
          ...standard(
            "project-proof",
            "FEATURED_PROJECT",
            "Selected work across the service area",
            "Only an explicitly selected Published project appears here.",
          ),
          eyebrow: "Project proof",
        },
        finalCta(
          "Is your property in an approved service area?",
          "Share the property and service details so CTPS can confirm the appropriate next step.",
        ),
      ],
    },
  },
  {
    pageKey: "BEFORE_AFTER",
    slug: "/before-after",
    title: "Before & After",
    navigationLabel: "Before & After",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Property transformations, shown with context.",
          "Explore Published CTPS project records through accessible comparisons and service-aware filtering.",
          "Before & After",
        ),
        finalCta(
          "Have a property-care project in mind?",
          "Share the requested services and property context for CTPS review.",
        ),
      ],
    },
  },
  {
    pageKey: "BLOG",
    slug: "/blog",
    title: "CTPS Journal",
    navigationLabel: "Blog",
    pageType: "LANDING",
    content: {
      sections: [
        hero(
          "Practical property-care guidance.",
          "Published CTPS articles bring together maintenance context, service preparation, and clear next steps.",
          "CTPS Journal",
        ),
        finalCta(
          "Need property-specific guidance?",
          "Explore the service catalogue or share a private quote request with CTPS.",
        ),
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
