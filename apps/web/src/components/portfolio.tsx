import { Container, Section } from "@ctps/ui/layout";
import { ImageComparison } from "@ctps/ui/image-comparison";
import Image from "next/image";
import Link from "next/link";

import { getService, getServiceArea } from "@/content/site";
import type { ManagedMedia, PublicProject } from "@/lib/before-after-api";
import { SectionHeading } from "./marketing";

function variant(media: ManagedMedia, preferred: "large" | "gallery" | "thumbnail" = "gallery") {
  return media.variants[preferred] ?? media.variants.original!;
}
export function ProjectComparison({
  project,
  priority = false,
}: {
  readonly project: PublicProject;
  readonly priority?: boolean;
}) {
  const before = variant(project.primaryBeforeMedia, "large");
  const after = variant(project.primaryAfterMedia, "large");
  return (
    <ImageComparison
      before={
        <Image
          alt={project.primaryBeforeMedia.altText}
          className="object-cover"
          fill
          priority={priority}
          sizes="(min-width:1024px) 55vw,100vw"
          src={before.path}
        />
      }
      after={
        <Image
          alt={project.primaryAfterMedia.altText}
          className="object-cover"
          fill
          priority={priority}
          sizes="(min-width:1024px) 55vw,100vw"
          src={after.path}
        />
      }
    />
  );
}
export function ProjectCard({ project }: { readonly project: PublicProject }) {
  const service = getService(project.serviceKey);
  const area = getServiceArea(project.serviceAreaKey);
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]">
      <ProjectComparison project={project} />
      <div className="p-6">
        <p className="eyebrow">
          {service?.name ?? project.serviceKey} · {area?.name ?? project.serviceAreaKey}
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          <Link href={`/before-after/${project.slug}`}>{project.title}</Link>
        </h2>
        <p className="mt-3 text-muted-foreground">{project.summary}</p>
        <Link
          className="mt-5 inline-block font-semibold text-primary"
          href={`/before-after/${project.slug}`}
        >
          View project details →
        </Link>
      </div>
    </article>
  );
}
export function PortfolioEmpty() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-2xl font-semibold">Published project stories are coming soon.</h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        The managed portfolio is ready, but CTPS has not published an approved before-and-after
        project yet. No demonstration imagery is presented as customer work.
      </p>
    </div>
  );
}
export function FeaturedProject({ project }: { readonly project: PublicProject | null }) {
  return (
    <Section className="bg-surface-muted/55">
      <Container>
        {project ? (
          <div className="grid items-center gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="eyebrow">Featured published project</p>
              <h2 className="public-heading mt-3">{project.title}</h2>
              <p className="mt-5 text-muted-foreground">{project.summary}</p>
              <Link
                className="mt-6 inline-block font-semibold text-primary"
                href={`/before-after/${project.slug}`}
              >
                Explore this project →
              </Link>
            </div>
            <ProjectComparison priority project={project} />
          </div>
        ) : (
          <>
            <SectionHeading
              eyebrow="Before & after"
              title="Approved project stories are on the way."
              copy="CTPS has not published a featured managed project yet. The portfolio will appear here only after real images and accessible descriptions pass review."
            />
            <div className="mt-8">
              <PortfolioEmpty />
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
export function ProjectDetail({ project }: { readonly project: PublicProject }) {
  const service = getService(project.serviceKey);
  const area = getServiceArea(project.serviceAreaKey);
  return (
    <>
      <section className="border-b border-border bg-secondary py-14 text-secondary-foreground sm:py-20">
        <Container>
          <p className="eyebrow text-primary">
            {service?.name} · {area?.name}
          </p>
          <h1 className="public-display mt-4 max-w-4xl">{project.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-sidebar-muted">{project.summary}</p>
        </Container>
      </section>
      <Section>
        <Container>
          <ProjectComparison priority project={project} />
          <div className="mx-auto mt-12 max-w-3xl">
            <h2 className="public-heading">Project overview</h2>
            {project.description
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph) => (
                <p className="mt-5 text-lg text-muted-foreground" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            {project.completedAt ? (
              <p className="mt-6 text-sm">
                <strong>Completion:</strong>{" "}
                {new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long" }).format(
                  new Date(project.completedAt),
                )}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              {service ? (
                <Link className="font-semibold text-primary" href={`/services/${service.slug}`}>
                  Related service: {service.name}
                </Link>
              ) : null}
              {area ? (
                <Link className="font-semibold text-primary" href={`/service-areas/${area.slug}`}>
                  Service area: {area.name}
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>
      {project.supportingMedia.length ? (
        <Section className="bg-surface-muted/55">
          <Container size="wide">
            <SectionHeading eyebrow="Supporting gallery" title="More views from this project." />
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {project.supportingMedia.map((link) => {
                const image = variant(link.media);
                return (
                  <figure
                    className="overflow-hidden rounded-lg border border-border bg-card"
                    key={link.id}
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        alt={link.media.altText}
                        className="object-cover"
                        fill
                        loading="lazy"
                        sizes="(min-width:1024px) 33vw,(min-width:640px) 50vw,100vw"
                        src={image.path}
                      />
                    </div>
                    {link.caption || link.media.caption ? (
                      <figcaption className="p-4 text-sm text-muted-foreground">
                        {link.caption ?? link.media.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
