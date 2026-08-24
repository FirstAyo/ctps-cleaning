import { Container, Section } from "@ctps/ui/layout";
import Link from "next/link";

import { FeaturedProject, PortfolioEmpty, ProjectCard, ProjectsHero } from "@/components/portfolio";
import { PublicLayout } from "@/components/public-shell";
import { serviceAreas, services } from "@/content/site";
import { getPublishedProjects } from "@/lib/before-after-api";
import { metadataFor } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<{ service?: string; area?: string; page?: string }>;
}) {
  const query = await searchParams;
  const metadata = metadataFor(
    "Projects",
    "Explore completed CTPS property-care projects across the services and communities we serve.",
    "/projects",
  );
  return query.service || query.area || query.page
    ? { ...metadata, robots: { index: false, follow: true } }
    : metadata;
}

function filterHref(service?: string, area?: string, page?: number) {
  const query = new URLSearchParams();
  if (service) query.set("service", service);
  if (area) query.set("area", area);
  if (page && page > 1) query.set("page", String(page));
  return query.size ? `/projects?${query}` : "/projects";
}

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ service?: string; area?: string; page?: string }>;
}) {
  const query = await searchParams;
  const service = services.some((item) => item.slug === query.service) ? query.service : undefined;
  const area = serviceAreas.some((item) => item.slug === query.area) ? query.area : undefined;
  const page = /^[1-9]\d*$/.test(query.page ?? "") ? query.page : undefined;
  const [result, featuredResult] = await Promise.all([
    getPublishedProjects({
      ...(page ? { page } : {}),
      ...(service ? { serviceKey: service } : {}),
      ...(area ? { serviceAreaKey: area } : {}),
    }),
    !service && !area && !page
      ? getPublishedProjects({ featured: "true", pageSize: "1" })
      : Promise.resolve({ items: [], page: 1, pageSize: 1, total: 0 }),
  ]);
  const featured = featuredResult.items[0] ?? null;
  const projects = result.items.filter((project) => project.id !== featured?.id);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <PublicLayout>
      <ProjectsHero />
      {featured ? <FeaturedProject project={featured} /> : null}
      <Section className="projects-index-section">
        <Container size="wide">
          <div className="projects-index-heading">
            <div>
              <p className="eyebrow">Recent projects</p>
              <h2 className="public-heading mt-3">Completed work, presented with context.</h2>
            </div>
            <p>
              Browse by service or community. Filters refine this archive without creating separate
              indexable pages.
            </p>
          </div>
          <nav aria-label="Filter projects by service" className="project-service-filters">
            <Link aria-current={!service ? "page" : undefined} href={filterHref(undefined, area)}>
              All Projects
            </Link>
            {services.map((item) => (
              <Link
                aria-current={service === item.slug ? "page" : undefined}
                href={filterHref(item.slug, area)}
                key={item.slug}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <form className="project-area-filter">
            {service ? <input name="service" type="hidden" value={service} /> : null}
            <label htmlFor="project-area">Community</label>
            <select defaultValue={area ?? ""} id="project-area" name="area">
              <option value="">All communities</option>
              {serviceAreas.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <button type="submit">Apply</button>
            {service || area ? <Link href="/projects">Clear filters</Link> : null}
          </form>
          <p aria-live="polite" className="project-result-count">
            {result.total} published {result.total === 1 ? "project" : "projects"} found.
          </p>
          {projects.length ? (
            <div className="projects-editorial-grid">
              {projects.map((project, index) => (
                <ProjectCard index={index} key={project.id} project={project} />
              ))}
            </div>
          ) : featured && result.total === 1 ? null : (
            <PortfolioEmpty />
          )}
          {pages > 1 ? (
            <nav aria-label="Projects pagination" className="projects-pagination">
              <Link
                aria-disabled={result.page <= 1}
                href={filterHref(service, area, Math.max(1, result.page - 1))}
              >
                Previous projects
              </Link>
              <span>
                Page {result.page} of {pages}
              </span>
              <Link
                aria-disabled={result.page >= pages}
                href={filterHref(service, area, Math.min(pages, result.page + 1))}
              >
                Next projects
              </Link>
            </nav>
          ) : null}
        </Container>
      </Section>
    </PublicLayout>
  );
}
