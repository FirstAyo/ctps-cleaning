import { normalizeSiteOrigin } from "@ctps/seo";

const configuredOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.WEB_URL ?? "http://localhost:3000";

export const site = {
  name: "CTPS",
  tagline: "Clean Precision",
  url: normalizeSiteOrigin(configuredOrigin),
  description:
    "Residential and commercial property-care services across Vancouver and surrounding communities.",
} as const;

export const publicIndexingEnabled = process.env.PUBLIC_INDEXING_ENABLED === "true";

export interface Service {
  readonly slug: string;
  readonly name: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly detail: string;
  readonly includes: readonly string[];
  readonly applications: readonly string[];
  readonly image: string;
  readonly alt: string;
  readonly faqs: readonly { readonly title: string; readonly content: string }[];
}

export const services: readonly Service[] = [
  {
    slug: "window-cleaning",
    name: "Window Cleaning",
    eyebrow: "Clearer outlooks",
    summary: "Thoughtful window care for residential and commercial properties.",
    detail:
      "CTPS can review exterior and, where offered, interior windows along with screens, tracks, and frames. Scope depends on access, property conditions, and the agreed quote.",
    includes: [
      "Exterior window review",
      "Interior window inquiry",
      "Screens where applicable",
      "Tracks and frames where applicable",
    ],
    applications: [
      "Houses and townhouses",
      "Accessible condominium windows",
      "Storefronts and offices",
      "Managed-property common areas",
    ],
    image: "/images/services/window-cleaning.svg",
    alt: "Abstract development illustration of a bright building window",
    faqs: [
      {
        title: "Are interior windows included?",
        content:
          "Interior work may be available, but it is not included by default. CTPS confirms the requested scope during quote review.",
      },
      {
        title: "How is pricing determined?",
        content:
          "Pricing is quote-based and can reflect window count, access, condition, and requested extras. No prices are confirmed on this page.",
      },
    ],
  },
  {
    slug: "pressure-washing",
    name: "Pressure Washing",
    eyebrow: "Surface-aware exterior care",
    summary: "Exterior cleaning inquiries assessed for the material, access, and drainage.",
    detail:
      "Potential areas include driveways, walkways, patios, suitable decks, exterior surfaces, and commercial entry areas. The cleaning approach must be selected for the surface rather than assumed.",
    includes: [
      "Surface suitability review",
      "Access and drainage considerations",
      "Driveways and walkways",
      "Patios, decks, and entry areas where appropriate",
    ],
    applications: [
      "Residential hardscapes",
      "Surface-appropriate decks",
      "Commercial entrances",
      "Managed exterior common areas",
    ],
    image: "/images/services/pressure-washing.svg",
    alt: "Abstract development illustration of a clean exterior walkway",
    faqs: [
      {
        title: "Can every exterior surface be pressure washed?",
        content:
          "No. Surface material and condition must be assessed so an appropriate technique can be considered.",
      },
      {
        title: "Is drainage reviewed?",
        content:
          "Access and drainage are among the details CTPS can consider before confirming scope and pricing.",
      },
    ],
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    eyebrow: "Seasonal property care",
    summary: "Debris-removal and downspout-review inquiries for accessible properties.",
    detail:
      "Gutter cleaning may include debris removal and a general downspout review, subject to property access and a quote-based assessment. It does not represent roofing repair or structural inspection.",
    includes: [
      "Accessible debris removal",
      "General downspout review",
      "Seasonal maintenance inquiry",
      "Residential or commercial assessment",
    ],
    applications: [
      "Houses and townhouses",
      "Managed residential properties",
      "Commercial properties",
      "Accessible multi-unit common areas",
    ],
    image: "/images/services/gutter-cleaning.svg",
    alt: "Abstract development illustration of a roof edge and gutter",
    faqs: [
      {
        title: "Does this include roof repair?",
        content:
          "No. Gutter cleaning does not claim roofing repair or structural inspection services.",
      },
      {
        title: "When is scope confirmed?",
        content:
          "CTPS reviews property access, requested work, and other relevant details before confirming a quote.",
      },
    ],
  },
  {
    slug: "moss-removal",
    name: "Moss Removal",
    eyebrow: "Careful condition review",
    summary: "Quote-based moss assessment for roof and exterior property surfaces.",
    detail:
      "A moss-removal inquiry begins with the surface, condition, safe-access needs, and cleanup expectations. Preventive treatment is discussed only where availability and methods are later confirmed.",
    includes: [
      "Roof or exterior moss assessment",
      "Property-surface considerations",
      "Safe-access review",
      "Debris-cleanup discussion",
    ],
    applications: [
      "Residential roof inquiries",
      "Exterior property surfaces",
      "Managed-property assessments",
      "Commercial exterior inquiries",
    ],
    image: "/images/services/moss-removal.svg",
    alt: "Abstract development illustration of a roof with restrained green detail",
    faqs: [
      {
        title: "What treatment products are used?",
        content:
          "No chemical or treatment process is promised here. CTPS must first confirm the service scope and appropriate approach.",
      },
      {
        title: "Can I book this directly online?",
        content: "No. The current path is a quote inquiry followed by CTPS review and contact.",
      },
    ],
  },
  {
    slug: "vent-cleaning",
    name: "Vent Cleaning",
    eyebrow: "Configurable service inquiries",
    summary: "A flexible inquiry category for residential and commercial vent needs.",
    detail:
      "Vent-cleaning inquiries may cover dryer vents, bathroom exhaust vents, HVAC or duct-related needs, and commercial vents. Availability and scope vary and must be confirmed by CTPS.",
    includes: [
      "Dryer vent inquiries",
      "Bathroom exhaust vent inquiries",
      "HVAC or duct-related inquiries",
      "Commercial vent inquiries",
    ],
    applications: [
      "Residential dryer vents",
      "Bathroom exhaust systems",
      "HVAC or duct-related inquiries",
      "Commercial vent inquiries",
    ],
    image: "/images/services/vent-cleaning.svg",
    alt: "Abstract development illustration of a circular ventilation grille",
    faqs: [
      {
        title: "Are all vent types currently offered?",
        content:
          "Not necessarily. Vent cleaning is presented as a configurable category; CTPS confirms availability and scope for each inquiry.",
      },
      {
        title: "Does this include mold or mechanical remediation?",
        content:
          "No. This page does not claim full HVAC remediation, mold treatment, or regulated mechanical services.",
      },
    ],
  },
] as const;

export interface ServiceArea {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly perspective: string;
}

export const serviceAreas: readonly ServiceArea[] = [
  {
    slug: "vancouver",
    name: "Vancouver",
    summary:
      "Property-care inquiries across Vancouver are reviewed by service, access, and property context.",
    perspective:
      "From residential properties to storefront and managed-property inquiries, CTPS starts with clear property details before confirming scope.",
  },
  {
    slug: "richmond",
    name: "Richmond",
    summary:
      "Richmond residential and commercial inquiries can cover the full CTPS service catalogue.",
    perspective:
      "Property type, exterior conditions, access, and requested services help CTPS evaluate each Richmond inquiry individually.",
  },
  {
    slug: "burnaby",
    name: "Burnaby",
    summary:
      "CTPS accepts quote inquiries for residential and commercial property care in Burnaby.",
    perspective:
      "Burnaby requests may combine multiple exterior-care categories, with final availability confirmed after CTPS reviews the submitted details.",
  },
  {
    slug: "surrey",
    name: "Surrey",
    summary: "Surrey is included in the planned CTPS Metro Vancouver service-area coverage.",
    perspective:
      "CTPS reviews location, service type, property context, and access before confirming whether a Surrey request can proceed.",
  },
  {
    slug: "coquitlam",
    name: "Coquitlam",
    summary:
      "Coquitlam property owners and managers can explore CTPS service categories and request review.",
    perspective:
      "A quote-based approach keeps combined services and property-specific access needs clear before any work is confirmed.",
  },
  {
    slug: "north-vancouver",
    name: "North Vancouver",
    summary:
      "North Vancouver, British Columbia is part of the confirmed CTPS service-area presentation.",
    perspective:
      "Exterior conditions and access can differ by property, so CTPS reviews each North Vancouver inquiry before confirming service scope.",
  },
] as const;

export const generalFaqs = [
  {
    title: "Does CTPS serve residential and commercial properties?",
    content:
      "Yes. The public service presentation supports both residential and commercial inquiries, subject to service availability, access, and quote review.",
  },
  {
    title: "Which communities are listed?",
    content:
      "The confirmed primary areas are Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver, British Columbia.",
  },
  {
    title: "Can I book a service online?",
    content:
      "No. Online direct booking is not available. The planned workflow is inquiry, CTPS review, and follow-up contact.",
  },
  {
    title: "Is the estimator a final price?",
    content:
      "No. The estimator provides a preliminary, non-binding range when an approved pricing version is available. Final pricing may change after CTPS reviews property details and requested services.",
  },
  {
    title: "Can I upload property photos?",
    content:
      "The quote request accepts multiple optional JPEG, PNG, or WebP property photos. They remain private and are available only to authorized staff reviewing the request.",
  },
  {
    title: "Are the before-and-after images real CTPS projects?",
    content:
      "Not yet. Current visuals are clearly labeled development demonstrations and are not represented as customer projects.",
  },
] as const;

export const plannedArticles = [
  "Window cleaning maintenance guide",
  "Seasonal gutter care checklist",
  "Understanding exterior moss growth",
  "Preparing a property for pressure washing",
  "Dryer vent maintenance overview",
] as const;

export const primaryNavigation = [
  { label: "Before & After", href: "/before-after" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "Estimate", href: "/estimate" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
export function getServiceArea(slug: string) {
  return serviceAreas.find((area) => area.slug === slug);
}
