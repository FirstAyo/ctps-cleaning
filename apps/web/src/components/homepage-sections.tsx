import { Container } from "@ctps/ui/layout";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  FileText,
  House,
  Layers,
  MapPin,
} from "@ctps/ui/icons";
import Image from "next/image";
import Link from "next/link";

import type { PublicProject } from "@/lib/before-after-api";
import type { PublicBlogPost } from "@/lib/blog-api";
import type { MarketingSection, PublishedMarketingPage } from "@/lib/marketing-api";
import { ProjectComparison } from "./portfolio";

const serviceFallbacks = [
  "/images/phase-11/hero-windows.webp",
  "/images/phase-11/hero-commercial.webp",
  "/images/phase-11/hero-courtyard.webp",
  "/images/phase-11/hero-residential.webp",
  "/images/phase-11/hero-windows.webp",
] as const;
const propertyFallbacks = [
  "/images/phase-11/hero-residential.webp",
  "/images/phase-11/hero-commercial.webp",
] as const;

function marketingImage(
  page: PublishedMarketingPage,
  section: MarketingSection,
  index: number,
  fallback: string,
) {
  const id = section.mediaIds[index];
  const media = id ? page.media.find((item) => item.id === id) : undefined;
  return media
    ? {
        src: `/media/marketing/${media.id}/large`,
        alt: media.altText,
        position: `${media.focalPointX}% ${media.focalPointY}%`,
      }
    : {
        src: process.env.NODE_ENV === "production" ? null : fallback,
        alt: "Architectural property-care development photography",
        position: "50% 50%",
      };
}

function DirectionalLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <Link className="editorial-action" href={href}>
      <span>{label}</span>
      <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
    </Link>
  );
}

export function PremiumTrustBar({ section }: { readonly section: MarketingSection }) {
  const icons = [House, MapPin, Layers, FileText];
  return (
    <section aria-label="CTPS service characteristics" className="home-trust-bar">
      <Container size="wide">
        <h2 className="sr-only">{section.title}</h2>
        <ul>
          {section.items?.map((item, index) => {
            const Icon = icons[index % icons.length]!;
            return (
              <li key={item.key}>
                <Icon aria-hidden="true" size={19} strokeWidth={1.6} />
                <div>
                  <strong>{item.title}</strong>
                  {item.body ? <span>{item.body}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export function EditorialServicesShowcase({
  page,
  section,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
}) {
  return (
    <section
      className="home-editorial-section home-services"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <header className="home-section-intro home-section-intro-split">
          <div>
            <p className="eyebrow">{section.eyebrow ?? "Services"}</p>
            <h2 className="public-heading" id={`${section.id}-title`}>
              {section.title}
            </h2>
          </div>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <div className="service-editorial-grid">
          {section.items?.map((item, index) => {
            const image = marketingImage(
              page,
              section,
              index,
              serviceFallbacks[index % serviceFallbacks.length]!,
            );
            return (
              <article
                className={`service-editorial-item service-editorial-item-${index + 1}`}
                key={item.key}
              >
                {image.src ? (
                  <Image
                    alt={image.alt}
                    fill
                    sizes={
                      index === 0
                        ? "(min-width: 900px) 60vw, 100vw"
                        : "(min-width: 900px) 35vw, 100vw"
                    }
                    src={image.src}
                    style={{ objectPosition: image.position }}
                  />
                ) : null}
                <div className="service-editorial-overlay" />
                <div className="service-editorial-copy">
                  <p>{String(index + 1).padStart(2, "0")} / Property care</p>
                  <h3>{item.title}</h3>
                  {item.body ? <span>{item.body}</span> : null}
                  {item.href ? <DirectionalLink href={item.href} label="Explore service" /> : null}
                </div>
              </article>
            );
          })}
        </div>
        {section.primaryCta ? (
          <div className="home-section-link">
            <DirectionalLink href={section.primaryCta.href} label={section.primaryCta.label} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export function FeaturedTransformation({
  project,
  section,
}: {
  readonly project: PublicProject | null;
  readonly section: MarketingSection;
}) {
  if (!project) return null;
  return (
    <section
      className="home-editorial-section featured-transformation"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <div className="transformation-layout">
          <div className="transformation-visual">
            <ProjectComparison priority project={project} />
          </div>
          <div className="transformation-copy">
            <p className="eyebrow">{section.eyebrow ?? "Before & after"}</p>
            <h2 className="public-heading" id={`${section.id}-title`}>
              {project.title}
            </h2>
            <p>{project.summary}</p>
            <DirectionalLink href={`/before-after/${project.slug}`} label="View project" />
          </div>
        </div>
      </Container>
    </section>
  );
}

export function PropertyTypeSplit({
  page,
  section,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
}) {
  return (
    <section className="property-type-split" aria-label={section.title}>
      {section.items?.slice(0, 2).map((item, index) => {
        const image = marketingImage(page, section, index, propertyFallbacks[index]!);
        const Icon = index === 0 ? House : Building2;
        return (
          <article key={item.key}>
            {image.src ? (
              <Image
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                src={image.src}
                style={{ objectPosition: image.position }}
              />
            ) : null}
            <div className="property-type-shade" />
            <div className="property-type-copy">
              <Icon aria-hidden="true" size={22} strokeWidth={1.5} />
              <p className="eyebrow">{item.title}</p>
              <h2>{item.body ?? section.title}</h2>
              {item.href ? (
                <DirectionalLink href={item.href} label={`Explore ${item.title.toLowerCase()}`} />
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function WhyCtpsEditorial({ section }: { readonly section: MarketingSection }) {
  return (
    <section className="home-editorial-section why-ctps" aria-labelledby={`${section.id}-title`}>
      <Container className="why-ctps-layout" size="wide">
        <div className="why-ctps-intro">
          <p className="eyebrow">{section.eyebrow ?? "Why CTPS"}</p>
          <h2 className="public-heading" id={`${section.id}-title`}>
            {section.title}
          </h2>
          {section.body ? <p>{section.body}</p> : null}
        </div>
        <ol className="why-ctps-list">
          {section.items?.map((item, index) => (
            <li key={item.key}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                {item.body ? <p>{item.body}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function ServiceProcessTimeline({ section }: { readonly section: MarketingSection }) {
  return (
    <section
      className="home-editorial-section process-section"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <header className="home-section-intro">
          <p className="eyebrow">{section.eyebrow ?? "How it works"}</p>
          <h2 className="public-heading" id={`${section.id}-title`}>
            {section.title}
          </h2>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <ol className="process-timeline">
          {section.items?.map((item, index) => (
            <li key={item.key}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              {item.body ? <p>{item.body}</p> : null}
            </li>
          ))}
        </ol>
        <p className="process-disclaimer">
          Scheduling follows staff review and confirmation. A request or preliminary estimate is not
          a booking.
        </p>
      </Container>
    </section>
  );
}

function projectAfterImage(project: PublicProject) {
  return (
    project.primaryAfterMedia.variants.large ??
    project.primaryAfterMedia.variants.gallery ??
    project.primaryAfterMedia.variants.original!
  );
}

export function ProjectMosaic({
  projects,
  section,
}: {
  readonly projects: readonly PublicProject[];
  readonly section: MarketingSection;
}) {
  if (!projects.length) return null;
  return (
    <section
      className="home-editorial-section project-mosaic-section"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <header className="home-section-intro home-section-intro-split">
          <div>
            <p className="eyebrow">{section.eyebrow ?? "Selected work"}</p>
            <h2 className="public-heading" id={`${section.id}-title`}>
              {section.title}
            </h2>
          </div>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <div className="project-mosaic">
          {projects.slice(0, 3).map((project, index) => {
            const image = projectAfterImage(project);
            return (
              <article
                className={`project-mosaic-item project-mosaic-item-${index + 1}`}
                key={project.id}
              >
                <Image
                  alt={project.primaryAfterMedia.altText}
                  fill
                  sizes={
                    index === 0
                      ? "(min-width: 900px) 65vw, 100vw"
                      : "(min-width: 900px) 35vw, 100vw"
                  }
                  src={image.path}
                />
                <div className="project-mosaic-shade" />
                <div>
                  <p>Published project</p>
                  <h3>{project.title}</h3>
                  <DirectionalLink href={`/before-after/${project.slug}`} label="View project" />
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function EditorialServiceAreas({ section }: { readonly section: MarketingSection }) {
  return (
    <section
      className="home-editorial-section service-areas-editorial"
      aria-labelledby={`${section.id}-title`}
    >
      <Container className="service-areas-layout" size="wide">
        <header>
          <p className="eyebrow">{section.eyebrow ?? "Service areas"}</p>
          <h2 className="public-heading" id={`${section.id}-title`}>
            {section.title}
          </h2>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <ul>
          {section.items?.map((item) => (
            <li key={item.key}>
              <Link href={item.href ?? `/service-areas/${item.key}`}>
                <span>{item.title}</span>
                <ArrowRight aria-hidden="true" size={22} strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function blogImage(post: PublicBlogPost, index: number) {
  return post.featuredMedia
    ? { src: `/media/blog/${post.featuredMedia.id}/featured`, alt: post.featuredMedia.altText }
    : {
        src:
          process.env.NODE_ENV === "production"
            ? null
            : serviceFallbacks[index % serviceFallbacks.length]!,
        alt: "Architectural property-care development photography",
      };
}

export function InsightsPreview({
  posts,
  section,
}: {
  readonly posts: readonly PublicBlogPost[];
  readonly section: MarketingSection;
}) {
  if (!posts.length) return null;
  return (
    <section
      className="home-editorial-section insights-editorial"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <header className="home-section-intro home-section-intro-split">
          <div>
            <p className="eyebrow">{section.eyebrow ?? "Insights"}</p>
            <h2 className="public-heading" id={`${section.id}-title`}>
              {section.title}
            </h2>
          </div>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <div className="insights-layout">
          {posts.slice(0, 3).map((post, index) => {
            const image = blogImage(post, index);
            return (
              <article className={`insight-item insight-item-${index + 1}`} key={post.slug}>
                {image.src ? (
                  <Link className="insight-image" href={`/blog/${post.slug}`}>
                    <Image
                      alt={image.alt}
                      fill
                      sizes={
                        index === 0
                          ? "(min-width: 900px) 60vw, 100vw"
                          : "(min-width: 900px) 32vw, 100vw"
                      }
                      src={image.src}
                    />
                  </Link>
                ) : null}
                <div className="insight-copy">
                  <p>
                    {post.categories[0]?.name ?? "CTPS Journal"} ·{" "}
                    {new Intl.DateTimeFormat("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(new Date(post.publishedAt))}
                  </p>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <span>{post.excerpt}</span>
                  <DirectionalLink href={`/blog/${post.slug}`} label="Read article" />
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function PremiumFinalCta({
  page,
  section,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
}) {
  const image = marketingImage(page, section, 0, "/images/phase-11/hero-courtyard.webp");
  return (
    <section className="premium-final-cta" aria-labelledby={`${section.id}-title`}>
      {image.src ? (
        <Image
          alt={image.alt}
          fill
          sizes="100vw"
          src={image.src}
          style={{ objectPosition: image.position }}
        />
      ) : null}
      <div className="premium-final-cta-shade" />
      <Container>
        <div className="premium-final-cta-copy">
          <p className="eyebrow">{section.eyebrow ?? "A clear next step"}</p>
          <h2 id={`${section.id}-title`}>{section.title}</h2>
          {section.body ? <p>{section.body}</p> : null}
          <div>
            {section.primaryCta ? (
              <Link className="premium-cta-primary" href={section.primaryCta.href}>
                {section.primaryCta.label}
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            ) : null}
            {section.secondaryCta ? (
              <Link className="premium-cta-secondary" href={section.secondaryCta.href}>
                {section.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
