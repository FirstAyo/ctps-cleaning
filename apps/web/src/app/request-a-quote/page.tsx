import { Container, Section } from "@ctps/ui/layout";
import { PageHero, SectionHeading } from "@/components/marketing";
import { PublicLayout } from "@/components/public-shell";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { metadataFor } from "@/lib/seo";

export const metadata = metadataFor(
  "Request a Quote",
  "Tell CTPS about your residential or commercial property-care needs and request a review.",
  "/request-a-quote",
);
export default function Page() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Request a quote"
        title="Tell us what the property needs."
        description="Choose one or more services, add the details that help our team review the work, and receive a reference confirming receipt. This is not a price, appointment, or booking."
      />
      <Section>
        <Container>
          <QuoteRequestForm />
        </Container>
      </Section>
      <Section className="bg-surface-muted/55" id="privacy">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Private by design"
            title="Your details support this request only."
            copy="Contact, property, and optional photo details are kept private and made available only to authorized staff reviewing your request. Photos are optional. CTPS will confirm scope, serviceability, timing, and any quote after review."
          />
        </Container>
      </Section>
    </PublicLayout>
  );
}
