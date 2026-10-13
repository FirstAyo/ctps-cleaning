import { Container, Section } from "@ctps/ui/layout";

import { SectionHeading } from "@/components/marketing";
import { PremiumHero } from "@/components/premium-hero";
import { PublicLayout } from "@/components/public-shell";
import { RequestPathTabs } from "@/components/request-path-tabs";
import { getMarketingMetadata, getMarketingPage, type MarketingSection } from "@/lib/marketing-api";
import { metadataFor } from "@/lib/seo";

const fallbackMetadata = metadataFor(
  "Request a Quote",
  "Tell CTPS about your residential or commercial property-care needs and request a review.",
  "/request-a-quote",
);

const fallbackHero: MarketingSection = {
  id: "hero",
  type: "HERO_SLIDER",
  enabled: true,
  eyebrow: "Request a quote",
  title: "Tell us what the property needs.",
  body: "Choose a quick message or a detailed property review and receive a reference confirming receipt. This is not a price, appointment, or booking.",
  primaryCta: {
    label: "Choose an inquiry path",
    href: "/request-a-quote#request-options",
  },
  secondaryCta: { label: "Explore the Estimator", href: "/estimate" },
  mediaIds: [],
  overlay: "BALANCED",
  autoplay: false,
  intervalMs: 7000,
};

export function generateMetadata() {
  return getMarketingMetadata("REQUEST_QUOTE", fallbackMetadata);
}

export default async function Page() {
  const page = await getMarketingPage("REQUEST_QUOTE");
  const managedHero = page?.publishedContent.sections.find(
    (section) => section.enabled && section.type === "HERO_SLIDER",
  );

  return (
    <PublicLayout>
      <div className="marketing-page marketing-page-request-quote">
        <PremiumHero media={page?.media ?? []} section={managedHero ?? fallbackHero} />
        <Container size="wide">
          <RequestPathTabs />
        </Container>
        <Section className="bg-surface-muted/55" id="privacy">
          <Container className="max-w-3xl">
            <SectionHeading
              copy="Contact, property, and optional photo details are kept private and made available only to authorized staff reviewing your request. Photos are optional. CTPS will confirm scope, serviceability, timing, and any quote after review."
              eyebrow="Private by design"
              title="Your details support this request only."
            />
          </Container>
        </Section>
      </div>
    </PublicLayout>
  );
}
