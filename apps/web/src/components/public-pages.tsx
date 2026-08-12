import { Accordion } from "@ctps/ui/navigation";
import { Container, Section } from "@ctps/ui/layout";
import {
  Button,
  FieldGroup,
  FormDescription,
  Input,
  Label,
  Select,
  Textarea,
} from "@ctps/ui/primitives";
import Image from "next/image";
import Link from "next/link";

import { generalFaqs, services } from "@/content/site";
import {
  AreaGrid,
  DemonstrationComparison,
  PhotoPreview,
  PlannedArticleGrid,
  QuoteCta,
  SectionHeading,
  ServiceGrid,
  PageHero,
} from "./marketing";
import { PublicLayout } from "./public-shell";

export function ServicesOverviewPage() {
  return (
    <PublicLayout>
      <PageHero
        description="Explore five CTPS property-care categories for residential and commercial inquiries. Scope and availability are confirmed through quote review."
        eyebrow="Services"
        image="/images/home/hero-property.svg"
        imageAlt="Original development illustration of a modern property exterior"
        title="One property. A coordinated view of care."
      />
      <Section>
        <Container size="wide">
          <ServiceGrid />
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <SectionHeading
            copy="The future workflow is designed to support one or more service categories without treating an inquiry as an appointment."
            eyebrow="Quote-based by design"
            title="Explore first. Confirm after review."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Select relevant services",
              "Describe property and access",
              "Wait for CTPS scope review",
            ].map((item, index) => (
              <div className="rounded-lg border border-border bg-card p-6" key={item}>
                <span className="text-primary">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-semibold">{item}</h3>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function ServiceAreasOverviewPage() {
  return (
    <PublicLayout>
      <PageHero
        description="CTPS presents residential and commercial property-care inquiries across six confirmed Metro Vancouver communities."
        eyebrow="Service areas"
        image="/images/service-areas/metro-vancouver.svg"
        imageAlt="Abstract local illustration of six Metro Vancouver service areas"
        title="Local coverage, without invented boundaries."
      />
      <Section>
        <Container size="wide">
          <SectionHeading
            copy="Each area page offers distinct context while avoiding unsupported project, neighborhood, or statistical claims."
            eyebrow="Primary communities"
            title="Choose an area to explore."
          />
          <AreaGrid />
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function AudiencePage({ commercial = false }: { readonly commercial?: boolean }) {
  const title = commercial
    ? "Commercial property care, framed around the site."
    : "Residential property care, framed around the home.";
  const items = commercial
    ? [
        "Storefronts",
        "Offices",
        "Managed properties",
        "Multi-unit common areas",
        "Commercial exterior surfaces",
      ]
    : [
        "Houses",
        "Townhouses",
        "Accessible condominium contexts",
        "Residential exterior surfaces",
        "Residential gutters and vents",
      ];
  return (
    <PublicLayout>
      <PageHero
        description={`${commercial ? "Commercial" : "Residential"} inquiries can combine relevant CTPS services while keeping access, property context, and quote review explicit.`}
        eyebrow={commercial ? "Commercial" : "Residential"}
        image="/images/home/hero-property.svg"
        imageAlt="Original development property illustration"
        title={title}
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionHeading
              copy="CTPS reviews the requested services, property information, access considerations, and any future supporting photos before confirming scope."
              eyebrow="Property contexts"
              title="Useful detail before assumptions."
            />
            <ul className="grid gap-3 rounded-xl border border-border bg-card p-7">
              {items.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span aria-hidden="true" className="text-accent">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container size="wide">
          <SectionHeading eyebrow="Relevant services" title="Five service categories to explore." />
          <ServiceGrid />
        </Container>
      </Section>
      <Section>
        <Container>
          <PhotoPreview />
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <SectionHeading eyebrow="Service areas" title="Coverage across six communities." />
          <AreaGrid />
        </Container>
      </Section>
      <Section>
        <Container className="max-w-3xl">
          <h2 className="public-heading">Common questions</h2>
          <div className="mt-7">
            <Accordion items={generalFaqs.slice(0, 4)} />
          </div>
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function BeforeAfterPage() {
  return (
    <PublicLayout>
      <PageHero
        description="An accessible public portfolio structure using original local development visuals until approved CTPS project media is available."
        eyebrow="Before & After"
        title="A project foundation that stays honest."
      />
      <Section>
        <Container>
          <DemonstrationComparison />
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container size="wide">
          <SectionHeading
            copy="This retained design demonstration uses visual labels only. The live /before-after route now uses published database records and server-side filters."
            eyebrow="Portfolio preview"
            title="Three demonstration compositions."
          />
          <div aria-label="Demonstration service filters" className="mt-7 flex flex-wrap gap-2">
            {["All demonstrations", "Windows", "Exteriors", "Gutters"].map((item) => (
              <span
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {services.slice(0, 3).map((service) => (
              <figure
                className="overflow-hidden rounded-lg border border-border bg-card"
                key={service.slug}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    alt={service.alt}
                    className="object-cover"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    src={service.image}
                  />
                </div>
                <figcaption className="p-5">
                  <strong>{service.name} layout demonstration</strong>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Not a customer, address, dated job, or completed CTPS project.
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function BlogPage() {
  return (
    <PublicLayout>
      <PageHero
        description="Explore published CTPS articles, practical maintenance context, and service-preparation guidance."
        eyebrow="CTPS Journal"
        title="Practical property-care guidance."
      />
      <Section>
        <Container size="wide">
          <SectionHeading
            copy="Every item is explicitly a topic placeholder—not published advice or a claim of CTPS expertise."
            eyebrow="Editorial roadmap"
            title="Planned topics, clearly labeled."
          />
          <PlannedArticleGrid />
        </Container>
      </Section>
      <QuoteCta
        title="Need service information now?"
        copy="Explore the current service pages or send the team a private quote request."
      />
    </PublicLayout>
  );
}

export function QuoteRequestPage() {
  return (
    <PublicLayout>
      <PageHero
        description="The live guest quote workflow gathers service and property context before secure submission."
        eyebrow="Quote request"
        title="Describe the property. Keep expectations clear."
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <SectionHeading
                copy="The flow gathers services, property context, contact details, optional photos, timing preferences, review, and consent."
                eyebrow="Request steps"
                title="A receipt request—not a booking."
              />
              <ol className="mt-7 grid gap-3">
                {[
                  "Choose one or more services",
                  "Add property information",
                  "Provide contact details",
                  "Add optional photos and preferences",
                  "Review and submit securely",
                ].map((item, index) => (
                  <li className="flex gap-3" key={item}>
                    <span className="text-primary">0{index + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <form
              aria-describedby="quote-preview-note"
              className="grid gap-5 rounded-xl border border-border bg-card p-6"
              onSubmit={undefined}
            >
              <p
                className="rounded-md bg-surface-muted p-3 text-sm font-semibold"
                id="quote-preview-note"
              >
                Workflow overview. Use the live form above to submit a request.
              </p>
              <FieldGroup>
                <Label htmlFor="preview-service">Service</Label>
                <Select disabled id="preview-service">
                  <option>Choose one or more services</option>
                </Select>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="preview-property">Property overview</Label>
                <Textarea
                  disabled
                  id="preview-property"
                  placeholder="Property details will be entered here"
                />
                <FormDescription>
                  Property and access context will support CTPS review.
                </FormDescription>
              </FieldGroup>
              <Button disabled type="submit">
                Use the live quote form
              </Button>
            </form>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <PhotoPreview />
        </Container>
      </Section>
      <Section id="privacy">
        <Container className="max-w-3xl">
          <SectionHeading
            copy="Contact and property details are used to review and respond to the private quote request. Production retention and final legal wording remain approval gates."
            eyebrow="Privacy"
            title="Collect only what the workflow needs."
          />
        </Container>
      </Section>
    </PublicLayout>
  );
}

export function AboutPage() {
  return (
    <PublicLayout>
      <PageHero
        description="CTPS is presented as a residential and commercial property-care business serving six confirmed Metro Vancouver communities."
        eyebrow="About CTPS"
        image="/images/about/ctps-purpose.svg"
        imageAlt="Original development illustration expressing the CTPS property-care purpose"
        title="A business purpose built around clear property-care inquiries."
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionHeading
              copy="CTPS covers window cleaning, pressure washing, gutter cleaning, moss removal, and configurable vent-cleaning inquiries through a quote-based approach."
              eyebrow="Confirmed purpose"
              title="Useful information before a commitment."
            />
            <div className="rounded-xl border border-border bg-card p-7">
              <h2 className="text-2xl font-semibold">Property-specific by design</h2>
              <p className="mt-4 text-muted-foreground">
                The public experience focuses on the services CTPS offers, the approved communities
                served, and a clear review process without relying on unsupported claims.
              </p>
            </div>
          </div>
        </Container>
      </Section>
      <Section className="bg-surface-muted/55">
        <Container>
          <SectionHeading
            copy="The public platform is designed to make services, service areas, preliminary estimating, quote inquiries, and future project documentation easier to understand."
            eyebrow="Digital communication"
            title="Calm, accessible, and explicit."
          />
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function ContactPage() {
  return (
    <PublicLayout>
      <PageHero
        description="Use Contact for general inquiries and Request a Quote for a property-specific service review."
        eyebrow="Contact"
        title="A clear place for general inquiries."
      />
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <h2 className="text-2xl font-semibold">Serving six primary communities</h2>
              <p className="mt-4 text-muted-foreground">
                Vancouver, Richmond, Burnaby, Surrey, Coquitlam, and North Vancouver, British
                Columbia.
              </p>
              <p className="mt-5 rounded-md border border-border bg-surface-muted p-4 text-sm">
                For service requests, use the secure quote workflow so the relevant property details
                reach CTPS together.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="font-semibold text-primary" href="/request-a-quote">
                  Request a Quote →
                </Link>
                <Link className="font-semibold text-primary" href="/estimate">
                  Preliminary estimator →
                </Link>
              </div>
            </div>
            <form
              aria-describedby="contact-status"
              className="grid gap-5 rounded-xl border border-border bg-card p-6"
            >
              <p
                className="rounded-md bg-surface-muted p-3 text-sm font-semibold"
                id="contact-status"
              >
                General contact submission is currently unavailable. Property-specific inquiries can
                use Request a Quote.
              </p>
              {[
                ["contact-name", "Name", "text"],
                ["contact-email", "Email", "email"],
                ["contact-phone", "Phone", "tel"],
                ["contact-subject", "Subject", "text"],
              ].map(([id, label, type]) => (
                <FieldGroup key={id}>
                  <Label htmlFor={id}>{label}</Label>
                  <Input disabled id={id} type={type} />
                </FieldGroup>
              ))}
              <FieldGroup>
                <Label htmlFor="contact-message">Message</Label>
                <Textarea disabled id="contact-message" />
              </FieldGroup>
              <Button disabled type="submit">
                General contact unavailable
              </Button>
            </form>
          </div>
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function FaqPage() {
  return (
    <PublicLayout>
      <PageHero
        description="Answers about CTPS service presentation, service areas, quote review, preliminary estimates, photo uploads, and current workflow limits."
        eyebrow="Frequently asked questions"
        title="Clear answers without unsupported promises."
      />
      <Section>
        <Container className="max-w-3xl">
          <Accordion items={generalFaqs} />
        </Container>
      </Section>
      <QuoteCta />
    </PublicLayout>
  );
}

export function PolicyFoundation({
  title,
  summary,
  sections,
}: {
  readonly title: string;
  readonly summary: string;
  readonly sections: readonly { readonly title: string; readonly body: string }[];
}) {
  return (
    <PublicLayout>
      <PageHero description={summary} eyebrow="Important information" title={title} />
      <Section>
        <Container className="max-w-3xl">
          <p className="rounded-md border border-warning/50 bg-warning/10 p-4 text-sm font-semibold">
            This information describes the current public policy position in plain language. Contact
            CTPS if you have questions about how it applies to an inquiry.
          </p>
          <div className="mt-10 grid gap-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </PublicLayout>
  );
}
