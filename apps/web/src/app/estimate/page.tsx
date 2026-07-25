import { Container, Section } from "@ctps/ui/layout";
import { EstimatorForm } from "@/components/estimator-form";
import { PageHero } from "@/components/marketing";
import { PublicLayout } from "@/components/public-shell";
import { metadataFor } from "@/lib/seo";

export const metadata = metadataFor(
  "Preliminary Price Estimator",
  "Get a preliminary, non-binding CTPS service estimate for an approved British Columbia service area.",
  "/estimate",
);
export default async function Page(
  { searchParams }: { searchParams: Promise<{ service?: string }> } = {
    searchParams: Promise.resolve({}),
  },
) {
  const query = await searchParams;
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Preliminary estimator"
        title="Plan with a clear starting range."
        description="Answer a few service-specific questions for a preliminary range. It is not a quote, offer, booking, or guarantee; CTPS confirms final scope and price after review."
      />
      <Section>
        <Container className="max-w-4xl">
          <EstimatorForm initialService={query.service ?? ""} />
        </Container>
      </Section>
    </PublicLayout>
  );
}
