import type { StructuredTextDocument, StructuredTextInline } from "@ctps/types";
import { Container, Section } from "@ctps/ui/layout";
import Image from "next/image";
import Link from "next/link";

import { getService, getServiceArea } from "@/content/site";
import type { ManagedMedia, PublicProject, PublicProjectContext } from "@/lib/before-after-api";
import { ImageComparison } from "@ctps/ui/image-comparison";

function variant(media: ManagedMedia, preferred: "large" | "gallery" | "thumbnail" = "gallery") {
  return media.variants[preferred] ?? media.variants.large ?? media.variants.original!;
}

function cover(project: PublicProject) {
  return project.coverMedia ?? project.primaryAfterMedia;
}

function projectMeta(project: PublicProject) {
  const service = getService(project.serviceKey);
  const area = getServiceArea(project.serviceAreaKey);
  return {
    service: service?.name ?? project.serviceKey,
    area: area?.name ?? project.serviceAreaKey,
  };
}

function completionDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long" }).format(new Date(value))
    : null;
}

function ProjectInline({ content }: { readonly content: readonly StructuredTextInline[] }) {
  return content.map((node, index) => {
    let child: React.ReactNode = node.text;
    for (const mark of node.marks) {
      if (mark.type === "bold") child = <strong>{child}</strong>;
      else if (mark.type === "italic") child = <em>{child}</em>;
      else if (mark.type === "underline") child = <u>{child}</u>;
      else if (mark.type === "link") child = <Link href={mark.href}>{child}</Link>;
    }
    return <span key={`${index}:${node.text}`}>{child}</span>;
  });
}

function StructuredProjectContent({
  blocks,
  className,
}: {
  readonly blocks: StructuredTextDocument;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = `${block.type}:${index}`;
        if (block.type === "richList") {
          const ListTag = block.style === "bullet" ? "ul" : "ol";
          return (
            <ListTag key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <ProjectInline content={item} />
                </li>
              ))}
            </ListTag>
          );
        }
        const content = <ProjectInline content={block.content} />;
        if (block.style === "heading2") return <h2 key={key}>{content}</h2>;
        if (block.style === "heading3") return <h3 key={key}>{content}</h3>;
        if (block.style === "blockquote") return <blockquote key={key}>{content}</blockquote>;
        return <p key={key}>{content}</p>;
      })}
    </div>
  );
}

export function ProjectComparison({ project }: { readonly project: PublicProject }) {
  const before = variant(project.primaryBeforeMedia, "large");
  const after = variant(project.primaryAfterMedia, "large");
  return (
    <ImageComparison
      before={
        <Image
          alt={project.primaryBeforeMedia.altText}
          className="object-cover"
          fill
          sizes="(min-width:1280px) 64vw,(min-width:768px) 90vw,100vw"
          src={before.path}
        />
      }
      after={
        <Image
          alt={project.primaryAfterMedia.altText}
          className="object-cover"
          fill
          sizes="(min-width:1280px) 64vw,(min-width:768px) 90vw,100vw"
          src={after.path}
        />
      }
    />
  );
}

function ProjectImage({
  project,
  kind = "gallery",
  priority = false,
  sizes,
}: {
  readonly project: PublicProject;
  readonly kind?: "large" | "gallery" | "thumbnail";
  readonly priority?: boolean;
  readonly sizes: string;
}) {
  const media = cover(project);
  const image = variant(media, kind);
  return (
    <Image
      alt={media.altText}
      className="object-cover"
      fill
      priority={priority}
      sizes={sizes}
      src={image.path}
    />
  );
}

export function ProjectsHero() {
  return (
    <section className="projects-hero">
      <Container size="wide">
        <p className="eyebrow">Projects</p>
        <h1>
          Real work.
          <br />
          Visible transformations.
        </h1>
        <p>Explore completed CTPS projects across the services and communities we serve.</p>
      </Container>
    </section>
  );
}

export function FeaturedProject({ project }: { readonly project: PublicProject }) {
  const { service, area } = projectMeta(project);
  return (
    <Section className="featured-project-section">
      <Container size="wide">
        <article className="featured-project">
          <Link
            aria-label={`View featured project: ${project.title}`}
            className="featured-project-media"
            href={`/projects/${project.slug}`}
          >
            <ProjectImage
              kind="large"
              priority
              project={project}
              sizes="(min-width:1024px) 68vw,100vw"
            />
          </Link>
          <div className="featured-project-copy">
            <p className="eyebrow">Featured Project</p>
            <p className="project-meta">
              {service} · {area}
            </p>
            <h2>{project.title}</h2>
            <p>{project.summary}</p>
            <Link href={`/projects/${project.slug}`}>
              View Project <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </Container>
    </Section>
  );
}

export function ProjectCard({
  project,
  index = 0,
}: {
  readonly project: PublicProject;
  readonly index?: number;
}) {
  const { service, area } = projectMeta(project);
  return (
    <article className={`project-tile project-tile-${index % 4}`}>
      <Link aria-label={`View project: ${project.title}`} href={`/projects/${project.slug}`}>
        <div className="project-tile-media">
          <ProjectImage
            project={project}
            sizes="(min-width:1100px) 58vw,(min-width:768px) 50vw,100vw"
          />
        </div>
        <div className="project-tile-copy">
          <p className="project-meta">
            {service} · {area}
          </p>
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
          <span className="project-tile-link">
            View Project <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

export function PortfolioEmpty() {
  return (
    <div className="projects-empty-state">
      <h2>Projects will appear here as completed work is published.</h2>
      <p>Explore CTPS services or tell us about the property care you need.</p>
      <Link href="/services">
        Explore Services <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function CompactProject({ project }: { readonly project: PublicProject }) {
  const { service, area } = projectMeta(project);
  return (
    <li>
      <Link aria-label={`View project: ${project.title}`} href={`/projects/${project.slug}`}>
        <div className="project-sidebar-thumb">
          <ProjectImage project={project} sizes="96px" kind="thumbnail" />
        </div>
        <span>
          <small>
            {service} · {area}
          </small>
          <strong>{project.title}</strong>
        </span>
      </Link>
    </li>
  );
}

function ProjectGroup({
  title,
  projects,
}: {
  readonly title: string;
  readonly projects: readonly PublicProject[];
}) {
  if (!projects.length) return null;
  return (
    <section className="project-sidebar-group">
      <h2>{title}</h2>
      <ul>
        {projects.map((project) => (
          <CompactProject key={project.id} project={project} />
        ))}
      </ul>
    </section>
  );
}

function ProjectNeighbour({
  project,
  direction,
}: {
  readonly project: PublicProject;
  readonly direction: "Previous" | "Next";
}) {
  const { service, area } = projectMeta(project);
  return (
    <Link
      className={`project-neighbour project-neighbour-${direction.toLowerCase()}`}
      href={`/projects/${project.slug}`}
    >
      <span className="project-neighbour-label">
        {direction === "Previous" ? "← " : ""}
        {direction} Project{direction === "Next" ? " →" : ""}
      </span>
      <span className="project-neighbour-media">
        <ProjectImage kind="thumbnail" project={project} sizes="(min-width:768px) 38vw,100vw" />
      </span>
      <span className="project-meta">
        {service} · {area}
      </span>
      <strong>{project.title}</strong>
    </Link>
  );
}

export function ProjectDetail({ context }: { readonly context: PublicProjectContext }) {
  const { project, relatedProjects, moreProjects, previousProject, nextProject } = context;
  const { service, area } = projectMeta(project);
  const completed = completionDate(project.completedAt);
  const heroMedia = cover(project);
  const heroImage = variant(heroMedia, "large");

  return (
    <>
      <section className="project-case-hero">
        <div className="project-case-hero-media">
          <Image
            alt={heroMedia.altText}
            className="object-cover"
            fill
            priority
            sizes="100vw"
            src={heroImage.path}
          />
          <div className="project-case-hero-shade" />
        </div>
        <Container className="project-case-hero-content" size="wide">
          <nav aria-label="Breadcrumb" className="project-breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/projects">Projects</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{project.title}</span>
          </nav>
          <p className="eyebrow">
            {service} · {area}
          </p>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
        </Container>
      </section>

      <Section className="project-case-body">
        <Container size="wide">
          <dl className="project-facts">
            <div>
              <dt>Service</dt>
              <dd>{service}</dd>
            </div>
            <div>
              <dt>Area</dt>
              <dd>{area}</dd>
            </div>
            {completed ? (
              <div>
                <dt>Completed</dt>
                <dd>{completed}</dd>
              </div>
            ) : null}
          </dl>
          <div className="project-case-layout">
            <div className="project-case-main">
              <section aria-labelledby="transformation-heading" className="project-transformation">
                <p className="eyebrow">The transformation</p>
                <h2 id="transformation-heading">Before &amp; After</h2>
                <p>Move the comparison control to inspect the completed transformation.</p>
                <div className="project-comparison-frame">
                  <ProjectComparison project={project} />
                </div>
              </section>
              <section aria-labelledby="story-heading" className="project-story">
                <p className="eyebrow">Project story</p>
                <h2 id="story-heading">The work, from assessment to result.</h2>
                {project.descriptionContent?.length ? (
                  <StructuredProjectContent
                    blocks={project.descriptionContent}
                    className="project-public-content"
                  />
                ) : (
                  <div className="project-public-content">
                    {project.description
                      .split(/\n+/)
                      .filter(Boolean)
                      .map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                  </div>
                )}
              </section>
              {project.supportingMedia.length ? (
                <section aria-labelledby="gallery-heading" className="project-gallery">
                  <p className="eyebrow">Project gallery</p>
                  <h2 id="gallery-heading">More views from the project.</h2>
                  <div className="project-gallery-grid">
                    {project.supportingMedia.map((link, index) => {
                      const image = variant(link.media, index === 0 ? "large" : "gallery");
                      return (
                        <figure key={link.id}>
                          <div className="project-gallery-media">
                            <Image
                              alt={link.media.altText}
                              className="object-cover"
                              fill
                              sizes={
                                index === 0
                                  ? "(min-width:1280px) 64vw,100vw"
                                  : "(min-width:768px) 32vw,100vw"
                              }
                              src={image.path}
                            />
                          </div>
                          {link.caption || link.media.caption ? (
                            <figcaption>{link.caption ?? link.media.caption}</figcaption>
                          ) : null}
                        </figure>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
            <aside aria-label="Explore more projects" className="project-case-sidebar">
              <ProjectGroup projects={relatedProjects} title="Related Projects" />
              <ProjectGroup projects={moreProjects} title="More Projects" />
              <section className="project-context-cta">
                <p className="eyebrow">Have a similar property?</p>
                <h2>Tell us about the work you need.</h2>
                <p>Share the property details and CTPS can review your request.</p>
                <Link href="/request-a-quote">
                  Request a Quote <span aria-hidden="true">→</span>
                </Link>
              </section>
            </aside>
          </div>
          {previousProject || nextProject ? (
            <nav aria-label="Previous and next projects" className="project-neighbours">
              {previousProject ? (
                <ProjectNeighbour direction="Previous" project={previousProject} />
              ) : (
                <span />
              )}
              {nextProject ? <ProjectNeighbour direction="Next" project={nextProject} /> : null}
            </nav>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
