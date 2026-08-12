import { Container } from "@ctps/ui/layout";
import { LinkButton } from "@ctps/ui/primitives";
import Image from "next/image";

import { MarketingPageRenderer } from "@/components/marketing-page-renderer";
import { PublicLayout } from "@/components/public-shell";
import { getPublishedProjects } from "@/lib/before-after-api";
import { getBlogPosts } from "@/lib/blog-api";
import { getMarketingMetadata, getMarketingPage } from "@/lib/marketing-api";
import { JsonLd, metadataFor, organizationSchema } from "@/lib/seo";

const fallbackMetadata = metadataFor(
  "Residential & Commercial Property Care",
  "Explore CTPS window, pressure washing, gutter, moss, and vent-cleaning services across six Metro Vancouver communities.",
  "/",
);

export function generateMetadata() {
  return getMarketingMetadata("HOME", fallbackMetadata);
}

function WebsiteSchema() {
  return (
    <JsonLd
      data={[
        organizationSchema,
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CTPS",
          url: "http://localhost:3000",
        },
      ]}
    />
  );
}

export default async function HomePage() {
  const [featuredProjects, projects, latestBlog, marketingPage] = await Promise.all([
    getPublishedProjects({ featured: "true", pageSize: "1" }),
    getPublishedProjects({ pageSize: "3" }),
    getBlogPosts({ pageSize: "3" }),
    getMarketingPage("HOME"),
  ]);
  const featured = featuredProjects.items[0] ?? null;

  if (marketingPage)
    return (
      <PublicLayout>
        <WebsiteSchema />
        <MarketingPageRenderer
          featuredProject={featured}
          page={marketingPage}
          posts={latestBlog.items}
          projects={projects.items}
        />
      </PublicLayout>
    );

  return (
    <PublicLayout>
      <WebsiteSchema />
      <section className="premium-hero" aria-labelledby="homepage-fallback-title">
        <div className="premium-hero-media">
          <Image
            alt="Architectural property-care development photography"
            className="is-active"
            fill
            priority
            sizes="100vw"
            src="/images/phase-11/hero-residential.webp"
          />
        </div>
        <div className="premium-hero-shade" />
        <Container className="premium-hero-content" size="wide">
          <p className="eyebrow">Property care, considered clearly</p>
          <h1 id="homepage-fallback-title">A cleaner exterior starts with a precise plan.</h1>
          <p className="premium-hero-copy">
            Residential and commercial property-care inquiries across Vancouver and surrounding
            communities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/request-a-quote">Request a Quote</LinkButton>
            <LinkButton href="/services" variant="outline">
              Explore Services
            </LinkButton>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
