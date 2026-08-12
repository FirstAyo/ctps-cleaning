import { Container, Section } from "@ctps/ui/layout";
import { LinkButton } from "@ctps/ui/primitives";
import Link from "next/link";

import type { PublicProject } from "@/lib/before-after-api";
import type { PublicBlogPost } from "@/lib/blog-api";
import type { MarketingSection, PublishedMarketingPage } from "@/lib/marketing-api";
import {
  EditorialServiceAreas,
  EditorialServicesShowcase,
  FeaturedTransformation,
  InsightsPreview,
  PremiumFinalCta,
  PremiumTrustBar,
  ProjectMosaic,
  PropertyTypeSplit,
  ServiceProcessTimeline,
  WhyCtpsEditorial,
} from "./homepage-sections";
import { SectionHeading } from "./marketing";
import { PremiumHero } from "./premium-hero";
import {
  EditorialAreas,
  EditorialContact,
  EditorialFaq,
  EditorialMediaText,
  EditorialPrinciples,
  EditorialProcess,
  EditorialProjectProof,
  EditorialPropertyTypes,
  EditorialRelated,
  EditorialRichText,
  EditorialServiceCatalogue,
} from "./marketing-page-sections";

function ItemGrid({ section }: { readonly section: MarketingSection }) {
  return (
    <div className="premium-card-grid">
      {section.items?.map((item, index) => (
        <article className="premium-content-card" key={item.key}>
          <span>0{index + 1}</span>
          <h3>{item.title}</h3>
          {item.body ? <p>{item.body}</p> : null}
          {item.href ? <Link href={item.href}>Explore</Link> : null}
        </article>
      ))}
    </div>
  );
}

function StandardSection({
  page,
  section,
  projects,
  settings,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
  readonly projects: readonly PublicProject[];
  readonly settings?: Record<string, string> | null;
}) {
  if (section.type === "RICH_TEXT") return <EditorialRichText section={section} />;
  if (section.type === "MEDIA_TEXT") return <EditorialMediaText page={page} section={section} />;
  if (section.type === "SERVICE_SHOWCASE")
    return <EditorialServiceCatalogue page={page} section={section} />;
  if (section.type === "SERVICE_AREAS") return <EditorialAreas section={section} />;
  if (section.type === "VALUE_PROPOSITION") return <EditorialPrinciples section={section} />;
  if (section.type === "PROCESS") return <EditorialProcess section={section} />;
  if (section.type === "RESIDENTIAL_COMMERCIAL")
    return <EditorialPropertyTypes section={section} />;
  if (section.type === "FAQ") return <EditorialFaq section={section} />;
  if (section.type === "RELATED_SERVICES")
    return <EditorialRelated page={page} section={section} />;
  if (section.type === "FEATURED_PROJECT") {
    const selected = projects.find((project) => section.projectIds?.includes(project.id)) ?? null;
    return <EditorialProjectProof project={selected} section={section} />;
  }
  if (section.type === "CONTACT")
    return <EditorialContact section={section} {...(settings !== undefined ? { settings } : {})} />;
  if (section.type === "FINAL_CTA") return <PremiumFinalCta page={page} section={section} />;
  return (
    <Section className={section.type === "RESIDENTIAL_COMMERCIAL" ? "premium-dark-section" : ""}>
      <Container size="wide">
        <SectionHeading
          {...(section.body ? { copy: section.body } : {})}
          eyebrow={section.eyebrow ?? section.type.replaceAll("_", " ")}
          title={section.title}
        />
        {section.items?.length ? <ItemGrid section={section} /> : null}
        {section.primaryCta ? (
          <LinkButton className="mt-8" href={section.primaryCta.href}>
            {section.primaryCta.label}
          </LinkButton>
        ) : null}
      </Container>
    </Section>
  );
}

function HomepageSection({
  page,
  section,
  featuredProject,
  projects,
  posts,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
  readonly featuredProject: PublicProject | null;
  readonly projects: readonly PublicProject[];
  readonly posts: readonly PublicBlogPost[];
}) {
  switch (section.type) {
    case "HERO_SLIDER":
      return <PremiumHero media={page.media} section={section} />;
    case "TRUST_STRIP":
      return <PremiumTrustBar section={section} />;
    case "SERVICE_SHOWCASE":
      return <EditorialServicesShowcase page={page} section={section} />;
    case "FEATURED_PROJECT":
      return <FeaturedTransformation project={featuredProject} section={section} />;
    case "RESIDENTIAL_COMMERCIAL":
      return <PropertyTypeSplit page={page} section={section} />;
    case "VALUE_PROPOSITION":
      return <WhyCtpsEditorial section={section} />;
    case "PROCESS":
      return <ServiceProcessTimeline section={section} />;
    case "PROJECT_GRID":
      return <ProjectMosaic projects={projects} section={section} />;
    case "SERVICE_AREAS":
      return <EditorialServiceAreas section={section} />;
    case "BLOG_PREVIEW":
      return <InsightsPreview posts={posts} section={section} />;
    case "FINAL_CTA":
      return <PremiumFinalCta page={page} section={section} />;
    default:
      return <StandardSection page={page} projects={projects} section={section} />;
  }
}

export function MarketingPageRenderer({
  page,
  featuredProject = null,
  projects = [],
  posts = [],
  settings = null,
}: {
  readonly page: PublishedMarketingPage;
  readonly featuredProject?: PublicProject | null;
  readonly projects?: readonly PublicProject[];
  readonly posts?: readonly PublicBlogPost[];
  readonly settings?: Record<string, string> | null;
}) {
  return (
    <div
      className={`marketing-page marketing-page-${page.pageKey.toLowerCase().replaceAll("_", "-")}`}
    >
      {page.publishedContent.sections
        .filter((section) => section.enabled)
        .map((section) =>
          page.pageKey === "HOME" ? (
            <HomepageSection
              featuredProject={featuredProject}
              key={section.id}
              page={page}
              posts={posts}
              projects={projects}
              section={section}
            />
          ) : (
            <div key={section.id}>
              {section.type === "HERO_SLIDER" ? (
                <PremiumHero media={page.media} section={section} />
              ) : (
                <StandardSection
                  page={page}
                  projects={projects}
                  section={section}
                  settings={settings}
                />
              )}
            </div>
          ),
        )}
    </div>
  );
}
