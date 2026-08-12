import { Container, Section } from "@ctps/ui/layout";
import { Select, Button, Label } from "@ctps/ui/primitives";
import Link from "next/link";

import { PageHero } from "@/components/marketing";
import { PortfolioEmpty, ProjectCard } from "@/components/portfolio";
import { PublicLayout } from "@/components/public-shell";
import { serviceAreas, services } from "@/content/site";
import { getPublishedProjects } from "@/lib/before-after-api";
import { metadataFor } from "@/lib/seo";
import { getMarketingPage } from "@/lib/marketing-api";
import { PremiumHero } from "@/components/premium-hero";

export const dynamic = "force-dynamic";
export const metadata = metadataFor(
  "Before & After",
  "Explore published CTPS before-and-after property-care projects with accessible image comparisons.",
  "/before-after",
);
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ service?: string; area?: string; page?: string }>;
}) {
  const query = await searchParams;
  const [result, marketingPage] = await Promise.all([
    getPublishedProjects({
      ...(/^[1-9]\d*$/.test(query.page ?? "") ? { page: query.page! } : {}),
      ...(services.some((item) => item.slug === query.service)
        ? { serviceKey: query.service! }
        : {}),
      ...(serviceAreas.some((item) => item.slug === query.area)
        ? { serviceAreaKey: query.area! }
        : {}),
    }),
    getMarketingPage("BEFORE_AFTER"),
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return (
    <PublicLayout>
      {marketingPage?.publishedContent?.sections.find(
        (section) => section.type === "HERO_SLIDER",
      ) ? (
        <PremiumHero
          media={marketingPage.media}
          section={marketingPage.publishedContent!.sections.find(
            (section) => section.type === "HERO_SLIDER",
          )!}
        />
      ) : (
        <PageHero
          description="Every project shown here is a published, managed CTPS portfolio record. Draft projects and private media are excluded."
          eyebrow="Before & After"
          title="Approved project stories, compared accessibly."
        />
      )}
      <Section>
        <Container size="wide">
          <form className="portfolio-filter-bar">
            <div>
              <Label htmlFor="portfolio-service">Service</Label>
              <Select defaultValue={query.service ?? ""} id="portfolio-service" name="service">
                <option value="">All services</option>
                {services.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="portfolio-area">Service area</Label>
              <Select defaultValue={query.area ?? ""} id="portfolio-area" name="area">
                <option value="">All service areas</option>
                {serviceAreas.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit">Apply filters</Button>
          </form>
          <p aria-live="polite" className="mt-5 text-sm text-muted-foreground">
            {result.total} published {result.total === 1 ? "project" : "projects"} found.
          </p>
          {result.items.length ? (
            <div className="portfolio-mosaic-grid">
              {result.items.map((project, index) => (
                <ProjectCard
                  featured={index === 0 && !query.page}
                  key={project.id}
                  project={project}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <PortfolioEmpty />
            </div>
          )}
          {pages > 1 ? (
            <nav
              aria-label="Portfolio pagination"
              className="mt-10 flex items-center justify-between"
            >
              <Link
                aria-disabled={result.page <= 1}
                className="font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
                href={{
                  pathname: "/before-after",
                  query: { ...query, page: String(Math.max(1, result.page - 1)) },
                }}
              >
                Previous
              </Link>
              <span>
                Page {result.page} of {pages}
              </span>
              <Link
                aria-disabled={result.page >= pages}
                className="font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
                href={{
                  pathname: "/before-after",
                  query: { ...query, page: String(Math.min(pages, result.page + 1)) },
                }}
              >
                Next
              </Link>
            </nav>
          ) : null}
        </Container>
      </Section>
    </PublicLayout>
  );
}
