import { Accordion } from "@ctps/ui/navigation";
import { Container } from "@ctps/ui/layout";
import { ArrowRight, ArrowUpRight, Building2, House } from "@ctps/ui/icons";
import Image from "next/image";
import Link from "next/link";

import type { PublicProject } from "@/lib/before-after-api";
import type { MarketingSection, PublishedMarketingPage } from "@/lib/marketing-api";
import { ProjectComparison } from "./portfolio";

function mediaFor(page: PublishedMarketingPage, section: MarketingSection, index = 0) {
  const id = section.mediaIds[index] ?? section.items?.[index]?.mediaId;
  const media = id ? page.media.find((item) => item.id === id) : undefined;
  return media
    ? {
        src: `/media/marketing/${media.id}/large`,
        alt: section.items?.[index]?.altText || media.altText,
        position: `${media.focalPointX}% ${media.focalPointY}%`,
      }
    : null;
}

function Action({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <Link className="editorial-action" href={href}>
      {label} <ArrowUpRight aria-hidden="true" size={17} />
    </Link>
  );
}

export function EditorialMediaText({
  page,
  section,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
}) {
  const image = mediaFor(page, section);
  return (
    <section
      className="marketing-editorial-section marketing-media-text"
      aria-labelledby={`${section.id}-title`}
    >
      <Container className="marketing-media-text-layout" size="wide">
        <div className="marketing-media-text-copy">
          <p className="eyebrow">{section.eyebrow ?? "Perspective"}</p>
          <h2 className="public-heading" id={`${section.id}-title`}>
            {section.title}
          </h2>
          {section.body ? <p>{section.body}</p> : null}
          {section.items?.[0]?.href ? (
            <Action href={section.items[0].href} label={section.items[0].title} />
          ) : null}
        </div>
        {image ? (
          <div className="marketing-editorial-image">
            <Image
              alt={image.alt}
              fill
              sizes="(min-width: 900px) 54vw, 100vw"
              src={image.src}
              style={{ objectPosition: image.position }}
            />
          </div>
        ) : (
          <div aria-hidden="true" className="marketing-neutral-panel">
            <span>{section.title}</span>
          </div>
        )}
      </Container>
    </section>
  );
}

export function EditorialServiceCatalogue({
  page,
  section,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
}) {
  return (
    <section
      className="marketing-editorial-section service-catalogue"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <header className="marketing-split-heading">
          <div>
            <p className="eyebrow">{section.eyebrow ?? "Services"}</p>
            <h2 className="public-heading" id={`${section.id}-title`}>
              {section.title}
            </h2>
          </div>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <div className="service-catalogue-list">
          {section.items?.map((item, index) => {
            const image = mediaFor(page, section, index);
            return (
              <article className="service-catalogue-row" key={item.key}>
                <div className="service-catalogue-number">{String(index + 1).padStart(2, "0")}</div>
                {image ? (
                  <div className="service-catalogue-image">
                    <Image
                      alt={image.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 900px) 34vw, 100vw"
                      src={image.src}
                      style={{ objectPosition: image.position }}
                    />
                  </div>
                ) : null}
                <div className="service-catalogue-copy">
                  <h3>{item.title}</h3>
                  {item.body ? <p>{item.body}</p> : null}
                  {item.href ? <Action href={item.href} label="Explore service" /> : null}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function EditorialPrinciples({ section }: { readonly section: MarketingSection }) {
  return (
    <section
      className="marketing-editorial-section marketing-principles"
      aria-labelledby={`${section.id}-title`}
    >
      <Container className="marketing-principles-layout" size="wide">
        <header>
          <p className="eyebrow">{section.eyebrow ?? "Principles"}</p>
          <h2 className="public-heading" id={`${section.id}-title`}>
            {section.title}
          </h2>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <ol>
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

export function EditorialProcess({ section }: { readonly section: MarketingSection }) {
  return (
    <section
      className="marketing-editorial-section marketing-process"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <p className="eyebrow">{section.eyebrow ?? "Process"}</p>
        <h2 className="public-heading" id={`${section.id}-title`}>
          {section.title}
        </h2>
        <ol>
          {section.items?.map((item, index) => (
            <li key={item.key}>
              <span>0{index + 1}</span>
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

export function EditorialPropertyTypes({ section }: { readonly section: MarketingSection }) {
  return (
    <section className="marketing-property-types" aria-labelledby={`${section.id}-title`}>
      <Container size="wide">
        <header className="marketing-split-heading">
          <div>
            <p className="eyebrow">{section.eyebrow ?? "Property types"}</p>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
          </div>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <div className="marketing-property-links">
          {section.items?.slice(0, 2).map((item, index) => {
            const Icon = index === 0 ? House : Building2;
            return (
              <article key={item.key}>
                <Icon aria-hidden="true" />
                <h3>{item.title}</h3>
                {item.body ? <p>{item.body}</p> : null}
                {item.href ? (
                  <Action href={item.href} label={`Explore ${item.title.toLowerCase()}`} />
                ) : null}
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function EditorialAreas({ section }: { readonly section: MarketingSection }) {
  return (
    <section
      className="marketing-editorial-section marketing-area-directory"
      aria-labelledby={`${section.id}-title`}
    >
      <Container size="wide">
        <header className="marketing-split-heading">
          <div>
            <p className="eyebrow">{section.eyebrow ?? "Service areas"}</p>
            <h2 className="public-heading" id={`${section.id}-title`}>
              {section.title}
            </h2>
          </div>
          {section.body ? <p>{section.body}</p> : null}
        </header>
        <div className="marketing-area-list">
          {section.items?.map((item, index) => (
            <Link href={item.href ?? "/service-areas"} key={item.key}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function EditorialFaq({ section }: { readonly section: MarketingSection }) {
  if (!section.items?.length) return null;
  return (
    <section className="marketing-editorial-section marketing-faq">
      <Container className="max-w-4xl">
        <p className="eyebrow">{section.eyebrow ?? "FAQ"}</p>
        <h2 className="public-heading">{section.title}</h2>
        {section.body ? <p className="marketing-faq-intro">{section.body}</p> : null}
        <Accordion
          items={section.items.map((item) => ({ title: item.title, content: item.body ?? "" }))}
        />
      </Container>
    </section>
  );
}

export function EditorialRelated({
  page,
  section,
}: {
  readonly page: PublishedMarketingPage;
  readonly section: MarketingSection;
}) {
  return (
    <section className="marketing-editorial-section marketing-related">
      <Container size="wide">
        <p className="eyebrow">{section.eyebrow ?? "Explore"}</p>
        <h2 className="public-heading">{section.title}</h2>
        <div>
          {section.items?.map((item, index) => {
            const image = mediaFor(page, section, index);
            return (
              <Link href={item.href ?? "/services"} key={item.key}>
                {image ? (
                  <span className="marketing-related-image">
                    <Image
                      alt={image.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 768px) 30vw, 100vw"
                      src={image.src}
                      style={{ objectPosition: image.position }}
                    />
                  </span>
                ) : null}
                <span>
                  <strong>{item.title}</strong>
                  {item.body ? <small>{item.body}</small> : null}
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function EditorialProjectProof({
  project,
  section,
}: {
  readonly project: PublicProject | null;
  readonly section: MarketingSection;
}) {
  if (!project) return null;
  return (
    <section className="marketing-editorial-section marketing-project-proof">
      <Container className="marketing-project-proof-layout" size="wide">
        <div>
          <ProjectComparison project={project} />
        </div>
        <div>
          <p className="eyebrow">{section.eyebrow ?? "Published work"}</p>
          <h2 className="public-heading">{project.title}</h2>
          <p>{project.summary}</p>
          <Action href={`/before-after/${project.slug}`} label="View project" />
        </div>
      </Container>
    </section>
  );
}

export function EditorialContact({
  section,
  settings,
}: {
  readonly section: MarketingSection;
  readonly settings?: Record<string, string> | null;
}) {
  const email = settings?.contactEmail;
  const phone = settings?.contactPhone;
  return (
    <section className="marketing-editorial-section marketing-contact">
      <Container className="marketing-contact-layout" size="wide">
        <div>
          <p className="eyebrow">{section.eyebrow ?? "Contact"}</p>
          <h2 className="public-heading">{section.title}</h2>
          {section.body ? <p>{section.body}</p> : null}
          <div className="marketing-contact-details">
            {email ? <a href={`mailto:${email}`}>{email}</a> : null}
            {phone ? <a href={`tel:${phone}`}>{phone}</a> : null}
            {!email && !phone ? (
              <p>For property-specific service requests, use the secure quote-request form.</p>
            ) : null}
          </div>
        </div>
        <form aria-describedby="general-contact-status" className="marketing-contact-form">
          <h3>General inquiry</h3>
          <label>
            Name
            <input autoComplete="name" disabled name="name" />
          </label>
          <label>
            Email
            <input autoComplete="email" disabled name="email" type="email" />
          </label>
          <label>
            Subject
            <input autoComplete="off" disabled name="subject" />
          </label>
          <label>
            Message
            <textarea autoComplete="off" disabled name="message" rows={5} />
          </label>
          <button disabled type="submit">
            Send general inquiry
          </button>
          <p id="general-contact-status">
            This contact form is unavailable until CTPS configures its receiving address. For
            service requests, use Request a Quote.
          </p>
        </form>
      </Container>
    </section>
  );
}

export function EditorialRichText({ section }: { readonly section: MarketingSection }) {
  return (
    <section className="marketing-editorial-section marketing-rich-text">
      <Container size="wide">
        <div>
          <p className="eyebrow">{section.eyebrow ?? "CTPS"}</p>
          <h2 className="public-heading">{section.title}</h2>
        </div>
        {section.body ? <p>{section.body}</p> : null}
      </Container>
    </section>
  );
}
