import { notFound } from "next/navigation";
import { Container, Section } from "@ctps/ui/layout";
import { PublicLayout } from "@/components/public-shell";
import { EstimateResultActions } from "@/components/estimate-result-actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Preliminary estimate result",
  robots: { index: false, follow: false },
};
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const api = process.env.API_URL;
  if (!api) notFound();
  const response = await fetch(
    new URL(`public/estimator/results/${token}`, api.endsWith("/") ? api : `${api}/`),
    { cache: "no-store" },
  );
  if (!response.ok) notFound();
  const result = (await response.json()) as {
    outcome: "RANGE" | "MANUAL_REVIEW";
    minimumCents: number | null;
    maximumCents: number | null;
    currency: string;
    publicDrivers: string[];
    assumptions: string[];
    exclusions: string[];
    disclaimer: string;
    expiresAt: string;
  };
  const money = (cents: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  return (
    <PublicLayout>
      <Section>
        <Container className="max-w-3xl">
          <article className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Preliminary estimate
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              {result.outcome === "RANGE" &&
              result.minimumCents !== null &&
              result.maximumCents !== null
                ? `${money(result.minimumCents)}–${money(result.maximumCents)} CAD`
                : "Manual review required"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {result.outcome === "RANGE"
                ? "This range is a planning aid based on the details supplied."
                : "The selected scope needs a closer review before CTPS can provide a responsible range."}
            </p>
            <h2 className="mt-8 text-xl font-bold">What influenced this result</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {result.publicDrivers.length ? (
                result.publicDrivers.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Base service configuration</li>
              )}
            </ul>
            <h2 className="mt-8 text-xl font-bold">Assumptions</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {result.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2 className="mt-8 text-xl font-bold">Exclusions</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {result.exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-8 rounded-lg bg-surface-muted p-4 text-sm">
              {result.disclaimer} Result access expires{" "}
              {new Date(result.expiresAt).toLocaleDateString("en-CA")}.
            </p>
            <EstimateResultActions token={token} />
          </article>
        </Container>
      </Section>
    </PublicLayout>
  );
}
