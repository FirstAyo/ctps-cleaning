import { Container, Section } from "@ctps/ui/layout";
import { LinkButton } from "@ctps/ui/primitives";
import Image from "next/image";
import Link from "next/link";

import {
  AreaGrid,
  DemonstrationComparison,
  PlannedArticleGrid,
  QuoteCta,
  SectionHeading,
  ServiceGrid,
} from "@/components/marketing";
import { PublicLayout } from "@/components/public-shell";
import { JsonLd, metadataFor, organizationSchema } from "@/lib/seo";

export const metadata = metadataFor(
  "Residential & Commercial Property Care",
  "Explore CTPS window, pressure washing, gutter, moss, and vent-cleaning services across six Metro Vancouver communities.",
  "/",
);
const trust = [
  "Residential and commercial service",
  "Five property-care categories",
  "Six primary service areas",
  "Quote-based workflow",
];

export default function HomePage() {
  return (
    <PublicLayout>
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
      <section className="overflow-hidden bg-secondary text-secondary-foreground">
        <Container
          className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:py-28"
          size="wide"
        >
          <div className="motion-reveal">
            <p className="eyebrow text-primary">Property care, considered clearly</p>
            <h1 className="public-display mt-5">A cleaner exterior starts with a precise plan.</h1>
            <p className="mt-6 max-w-xl text-lg text-sidebar-muted">
              Residential and commercial window, exterior, gutter, moss, and vent-care inquiries
              across Vancouver and surrounding communities.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton className="min-h-12 px-6" href="/request-a-quote">
                Request a Quote
              </LinkButton>
              <LinkButton
                className="min-h-12 border-sidebar-border bg-transparent px-6 text-white hover:bg-sidebar-accent"
                href="/estimate"
                variant="outline"
              >
                Get an Estimate
              </LinkButton>
            </div>
            <div className="mt-9 flex flex-wrap gap-3 text-sm text-sidebar-muted">
              <span className="rounded-full border border-sidebar-border px-3 py-1">
                Serving six Metro Vancouver communities
              </span>
              <span className="rounded-full border border-sidebar-border px-3 py-1">
                Residential + commercial
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] border border-sidebar-border shadow-[var(--shadow-overlay)]">
              <Image
                alt="Original development illustration of a modern property exterior"
                className="object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                src="/images/home/hero-property.svg"
              />
            </div>
            <div className="absolute -bottom-5 left-4 max-w-xs rounded-lg border border-border bg-surface p-4 text-foreground shadow-[var(--shadow-md)] sm:left-8">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Capability statement
              </p>
              <p className="mt-1 font-semibold">
                One clear path from service research to CTPS review.
              </p>
            </div>
          </div>
        </Container>
      </section>
      <section
        aria-label="CTPS service characteristics"
        className="border-b border-border bg-surface"
      >
        <Container className="grid gap-px py-6 sm:grid-cols-2 lg:grid-cols-4" size="wide">
          {trust.map((item) => (
            <p className="border-border px-4 py-2 text-sm font-semibold sm:border-l" key={item}>
              {item}
            </p>
          ))}
        </Container>
      </section>
      <Section>
        <Container size="wide">
          <SectionHeading
            copy="Five service families, presented with enough context to help customers begin the right inquiry."
            eyebrow="Services"
            title="Property care without template thinking."
          />
          <ServiceGrid />
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <DemonstrationComparison />
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <SectionHeading
              copy="CTPS focuses its public experience on clear expectations and useful property information—not unsupported promises."
              eyebrow="Why CTPS"
              title="Clarity is part of the service."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Clear quote-request process",
                "Residential and commercial options",
                "Mobile-friendly customer experience",
                "Visual documentation planned",
              ].map((item, index) => (
                <div className="rounded-lg border border-border bg-card p-6" key={item}>
                  <span className="text-sm font-bold text-primary">0{index + 1}</span>
                  <h3 className="mt-4 text-xl font-semibold">{item}</h3>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
      <Section className="bg-secondary text-secondary-foreground">
        <Container size="wide">
          <SectionHeading
            copy="Different property contexts deserve distinct conversations, while preserving the same clear quote-based path."
            eyebrow="Property types"
            title="Residential detail. Commercial perspective."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-8">
              <p className="eyebrow text-primary">Residential</p>
              <h3 className="mt-3 text-3xl font-semibold">
                Care around the way a home is accessed.
              </h3>
              <p className="mt-4 text-sidebar-muted">
                Houses, townhouses, accessible condominium contexts, exterior surfaces, gutters, and
                vent inquiries.
              </p>
              <Link className="mt-7 inline-block font-semibold text-white" href="/residential">
                Explore residential service →
              </Link>
            </article>
            <article className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-8">
              <p className="eyebrow text-primary">Commercial</p>
              <h3 className="mt-3 text-3xl font-semibold">A practical view of managed spaces.</h3>
              <p className="mt-4 text-sidebar-muted">
                Storefronts, offices, managed properties, commercial exteriors, and multi-unit
                common areas.
              </p>
              <Link className="mt-7 inline-block font-semibold text-white" href="/commercial">
                Explore commercial service →
              </Link>
            </article>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="A four-step, quote-based process."
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              "Explore services",
              "Request a quote or explore the future estimator",
              "CTPS reviews property details",
              "CTPS contacts the customer",
            ].map((step, index) => (
              <li className="relative border-t-2 border-primary pt-5" key={step}>
                <span className="text-sm font-bold text-primary">0{index + 1}</span>
                <p className="mt-3 font-semibold">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            This process does not confirm a booking or automatically approve pricing.
          </p>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container size="wide">
          <SectionHeading
            copy="Original local illustrations reserve a responsive gallery structure for the database-backed project system planned in Phase 5."
            eyebrow="Featured project gallery"
            title="Honest demonstrations, ready for real work."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              "/images/services/window-cleaning.svg",
              "/images/services/pressure-washing.svg",
              "/images/services/gutter-cleaning.svg",
            ].map((src, index) => (
              <figure className="overflow-hidden rounded-lg border border-border bg-card" key={src}>
                <div className="relative aspect-[4/3]">
                  <Image
                    alt={`Development demonstration gallery visual ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    src={src}
                  />
                </div>
                <figcaption className="p-4 text-sm">
                  <strong>Development demonstration</strong>
                  <span className="mt-1 block text-muted-foreground">
                    Not a CTPS customer or completed project.
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid items-center gap-10 rounded-[var(--radius-xl)] border border-border bg-card p-7 shadow-[var(--shadow-md)] lg:grid-cols-[1fr_auto] lg:p-10">
            <div>
              <p className="eyebrow">Price estimator preview</p>
              <h2 className="public-heading mt-3">A preliminary range, never a final quote.</h2>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                The future estimator will ask service-specific questions, provide a non-binding
                range, and offer a path into a quote request. No prices or calculations are active
                now.
              </p>
            </div>
            <LinkButton href="/estimate">See what is planned</LinkButton>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container size="wide">
          <SectionHeading
            copy="Explore the six confirmed primary communities. Availability for each property is confirmed during review."
            eyebrow="Service areas"
            title="Metro Vancouver coverage."
          />
          <AreaGrid />
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading
            align="center"
            copy="Verified customer feedback will be added before production. No names, ratings, review platforms, or testimonial claims are represented here."
            eyebrow="Testimonials"
            title="A place reserved for verified voices."
          />
          <div className="mx-auto mt-8 max-w-xl rounded-lg border border-dashed border-border p-7 text-center text-muted-foreground">
            Customer feedback is intentionally empty until approved source material is available.
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container size="wide">
          <SectionHeading
            copy="These are planned editorial topics—not published articles, author profiles, or dated CTPS advice."
            eyebrow="From the planned blog"
            title="Useful guidance, with publishing still ahead."
          />
          <PlannedArticleGrid limit={3} />
          <Link className="mt-7 inline-block font-semibold text-primary" href="/blog">
            View the blog foundation →
          </Link>
        </Container>
      </Section>
      <QuoteCta title="Ready to describe the property?" />
    </PublicLayout>
  );
}
