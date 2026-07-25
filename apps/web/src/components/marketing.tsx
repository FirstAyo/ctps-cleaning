import { Accordion } from "@ctps/ui/navigation";
import { Container, Section } from "@ctps/ui/layout";
import { LinkButton } from "@ctps/ui/primitives";
import Image from "next/image";
import Link from "next/link";

import type { Service, ServiceArea } from "@/content/site";
import { plannedArticles, serviceAreas, services } from "@/content/site";
import { MarketingComparison } from "./marketing-comparison";

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly copy?: string;
  readonly align?: "left" | "center";
}) {
  return (
    <header className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="public-heading mt-3">{title}</h2>
      {copy ? <p className="mt-5 text-lg text-muted-foreground">{copy}</p> : null}
    </header>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  estimateHref = "/estimate",
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly estimateHref?: string;
}) {
  return (
    <section className="overflow-hidden border-b border-border bg-secondary text-secondary-foreground">
      <Container
        className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24"
        size="wide"
      >
        <div>
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h1 className="public-display mt-4 max-w-4xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-sidebar-muted">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/request-a-quote">Request a Quote</LinkButton>
            <LinkButton href={estimateHref} variant="outline">
              Explore the Estimator
            </LinkButton>
          </div>
        </div>
        {image ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-sidebar-border">
            <Image
              alt={imageAlt ?? ""}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              src={image}
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="hidden aspect-[4/3] rounded-[var(--radius-xl)] border border-sidebar-border bg-[linear-gradient(135deg,var(--sidebar-accent),var(--primary),var(--accent))] lg:block"
          />
        )}
      </Container>
    </section>
  );
}

export function ServiceCard({
  service,
  featured = false,
}: {
  readonly service: Service;
  readonly featured?: boolean;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] ${featured ? "lg:col-span-2 lg:row-span-2" : ""}`}
    >
      <div className={`relative overflow-hidden ${featured ? "aspect-[16/8]" : "aspect-[16/10]"}`}>
        <Image
          alt={service.alt}
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          fill
          sizes={featured ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          src={service.image}
        />
      </div>
      <div className="p-6">
        <p className="eyebrow">{service.eyebrow}</p>
        <h3 className="mt-2 text-2xl font-semibold">{service.name}</h3>
        <p className="mt-3 text-muted-foreground">{service.summary}</p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
          href={`/services/${service.slug}`}
        >
          Explore {service.name.toLowerCase()}{" "}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

export function ServiceGrid() {
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {services.map((service, index) => (
        <ServiceCard featured={index === 0} key={service.slug} service={service} />
      ))}
    </div>
  );
}

export function AreaGrid() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {serviceAreas.map((area, index) => (
        <Link
          className="group rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-colors hover:border-primary"
          href={`/service-areas/${area.slug}`}
          key={area.slug}
        >
          <span className="text-sm font-semibold text-primary">0{index + 1}</span>
          <h3 className="mt-5 text-2xl font-semibold">{area.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{area.summary}</p>
          <span className="mt-5 inline-block font-semibold">
            View area <span aria-hidden="true">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function QuoteCta({
  title = "Start with the property details.",
  copy = "Choose a service, share the property context, and CTPS can review the request before confirming scope or pricing.",
}: {
  readonly title?: string;
  readonly copy?: string;
}) {
  return (
    <Section className="bg-primary text-primary-foreground">
      <Container>
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow text-primary-foreground/75">A clear next step</p>
            <h2 className="public-heading mt-3">{title}</h2>
            <p className="mt-4 max-w-2xl text-primary-foreground/85">{copy}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton
              className="border-white bg-white text-secondary hover:bg-white/90"
              href="/request-a-quote"
            >
              Request a Quote
            </LinkButton>
            <LinkButton
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
              href="/contact"
              variant="outline"
            >
              Contact foundation
            </LinkButton>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function DemonstrationComparison() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr]">
      <div>
        <p className="eyebrow">Development demonstration</p>
        <h2 className="public-heading mt-3">A comparison built for every input.</h2>
        <p className="mt-5 text-muted-foreground">
          These original local illustrations demonstrate the accessible comparison experience. They
          are not a CTPS customer property or completed project.
        </p>
        <Link className="mt-6 inline-block font-semibold text-primary" href="/before-after">
          Visit the portfolio foundation →
        </Link>
      </div>
      <MarketingComparison />
    </div>
  );
}

export function PlannedArticleGrid({ limit = 5 }: { readonly limit?: number }) {
  return (
    <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {plannedArticles.slice(0, limit).map((title, index) => (
        <article className="rounded-lg border border-border bg-card p-6" key={title}>
          <p className="eyebrow">Planned topic 0{index + 1}</p>
          <h3 className="mt-3 text-xl font-semibold">{title}</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Editorial development placeholder. No article, author, or publication date is
            represented.
          </p>
        </article>
      ))}
    </div>
  );
}

export function PhotoPreview() {
  const photos = ["Property overview", "Access detail", "Surface condition", "Primary photo"];
  return (
    <section
      aria-labelledby="photo-preview-title"
      className="rounded-[var(--radius-xl)] border border-border bg-surface-muted/55 p-6 sm:p-8"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="eyebrow">Future workflow preview</p>
          <h2 className="mt-2 text-2xl font-semibold" id="photo-preview-title">
            Multiple property photos
          </h2>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm">
          Static preview · 4 of 8 example slots
        </span>
      </div>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        The live quote workflow validates file type, size, and count and supports private previews,
        removal, retry, and useful reordering. This overview itself does not open a file picker.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <div className="rounded-md border border-border bg-card p-3" key={photo}>
            <div
              aria-hidden="true"
              className="aspect-[4/3] rounded-sm bg-[linear-gradient(135deg,var(--surface-muted),var(--primary)/30,var(--accent)/30)]"
            />
            <p className="mt-3 text-sm font-semibold">{photo}</p>
            <p className="text-xs text-muted-foreground">
              Position {index + 1}
              {index === 3 ? " · Primary marker" : " · Reorder/remove planned"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServicePageContent({ service }: { readonly service: Service }) {
  return (
    <>
      <PageHero
        description={service.detail}
        eyebrow={service.eyebrow}
        image={service.image}
        imageAlt={service.alt}
        title={service.name}
        estimateHref={`/estimate?service=${service.slug}`}
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                copy={service.summary}
                eyebrow="Service overview"
                title={`A considered approach to ${service.name.toLowerCase()}.`}
              />
              <ul className="mt-7 grid gap-3">
                {service.includes.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted/55 p-7">
              <h2 className="text-2xl font-semibold">Residential and commercial applications</h2>
              <ul className="mt-5 grid gap-3">
                {service.applications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                Every option remains subject to property access, service availability, and quote
                review.
              </p>
            </div>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <DemonstrationComparison />
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading eyebrow="General process" title="Inquiry before confirmation." />
              <ol className="mt-7 grid gap-4">
                {[
                  "Explore the service scope",
                  "Share property and access details",
                  "CTPS reviews the inquiry",
                  "CTPS contacts the customer",
                ].map((step, index) => (
                  <li className="flex gap-4" key={step}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="pt-1 font-semibold">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
              <Accordion items={service.faqs} />
            </div>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <SectionHeading eyebrow="Related coverage" title="Six primary service areas." />
          <AreaGrid />
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Planned editorial"
            title={`Future guidance related to ${service.name.toLowerCase()}.`}
          />
          <PlannedArticleGrid limit={3} />
        </Container>
      </Section>
      <QuoteCta />
    </>
  );
}

export function AreaPageContent({ area }: { readonly area: ServiceArea }) {
  const faqs = [
    {
      title: `Does CTPS serve all properties in ${area.name}?`,
      content: `CTPS lists ${area.name} as a primary service area, but each inquiry is reviewed for service availability, property context, and access before scope is confirmed.`,
    },
    {
      title: "Can I combine service requests?",
      content:
        "Yes. The quote request supports one or more approved services in a single private inquiry.",
    },
  ];
  return (
    <>
      <PageHero
        description={area.summary}
        eyebrow="Service area"
        image="/images/service-areas/metro-vancouver.svg"
        imageAlt="Abstract development map showing the six CTPS service areas"
        title={`${area.name} property-care inquiries`}
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_.8fr]">
            <div>
              <SectionHeading
                copy={area.perspective}
                eyebrow="Local context"
                title={`A clear quote path for ${area.name}.`}
              />
              <p className="mt-5 text-muted-foreground">
                CTPS presents window cleaning, pressure washing, gutter cleaning, moss removal, and
                configurable vent-cleaning inquiries for residential and commercial customers.
                Availability is confirmed after review.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-7">
              <h2 className="text-2xl font-semibold">Quote workflow</h2>
              <ol className="mt-5 grid gap-3 text-sm">
                <li>1. Choose relevant services.</li>
                <li>2. Share the property context.</li>
                <li>3. CTPS reviews location and access.</li>
                <li>4. CTPS follows up; no booking is automatic.</li>
              </ol>
            </div>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <SectionHeading
            eyebrow="Available categories"
            title={`Explore services for ${area.name}.`}
          />
          <ServiceGrid />
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl">
          <h2 className="public-heading">Area questions</h2>
          <div className="mt-8">
            <Accordion items={faqs} />
          </div>
        </Container>
      </Section>
      <QuoteCta title={`Planning property care in ${area.name}?`} />
    </>
  );
}
