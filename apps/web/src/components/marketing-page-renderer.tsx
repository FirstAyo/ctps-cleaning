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
import { AreaGrid, QuoteCta, SectionHeading, ServiceGrid } from "./marketing";
import { PremiumHero } from "./premium-hero";

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

function StandardSection({ section }: { readonly section: MarketingSection }) {
  if (section.type === "SERVICE_SHOWCASE")
    return (
      <Section>
        <Container size="wide">
          <SectionHeading
            {...(section.body ? { copy: section.body } : {})}
            eyebrow={section.eyebrow ?? "Services"}
            title={section.title}
          />
          <ServiceGrid />
        </Container>
      </Section>
    );
  if (section.type === "SERVICE_AREAS")
    return (
      <Section className="premium-tint">
        <Container size="wide">
          <SectionHeading
            {...(section.body ? { copy: section.body } : {})}
            eyebrow={section.eyebrow ?? "Service areas"}
            title={section.title}
          />
          <AreaGrid />
        </Container>
      </Section>
    );
  if (section.type === "FINAL_CTA")
    return <QuoteCta {...(section.body ? { copy: section.body } : {})} title={section.title} />;
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
      return <StandardSection section={section} />;
  }
}

export function MarketingPageRenderer({
  page,
  featuredProject = null,
  projects = [],
  posts = [],
}: {
  readonly page: PublishedMarketingPage;
  readonly featuredProject?: PublicProject | null;
  readonly projects?: readonly PublicProject[];
  readonly posts?: readonly PublicBlogPost[];
}) {
  return (
    <>
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
                <StandardSection section={section} />
              )}
            </div>
          ),
        )}
    </>
  );
}
