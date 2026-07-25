import { Container, Section } from "@ctps/ui/layout";
import Link from "next/link";
import { PublicLayout } from "@/components/public-shell";
import { metadataFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = {
  ...metadataFor(
    "Quote request received",
    "Confirmation that CTPS received a private quote request.",
    "/request-a-quote/confirmation",
  ),
  robots: { index: false, follow: false },
};
async function confirmation(token: string) {
  if (!token) return null;
  const api = process.env.API_URL;
  if (!api) return null;
  try {
    const response = await fetch(
      new URL(
        `public/quote-requests/confirmation/${encodeURIComponent(token)}`,
        api.endsWith("/") ? api : `${api}/`,
      ),
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as { reference: string; submittedAt: string; message: string };
  } catch {
    return null;
  }
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; duplicate?: string }>;
}) {
  const query = await searchParams;
  const result = await confirmation(query.token ?? "");
  return (
    <PublicLayout>
      <Section>
        <Container className="max-w-2xl py-16">
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Request received
            </p>
            <h1 className="mt-3 text-3xl font-bold">Thank you for contacting CTPS.</h1>
            {result ? (
              <>
                <p className="mt-5 text-lg">
                  Your reference is{" "}
                  <strong className="font-mono tracking-wide">
                    {result.reference.toUpperCase()}
                  </strong>
                  .
                </p>
                <p className="mt-3 text-muted-foreground">
                  Save this reference. It confirms receipt only and is not a quote, price,
                  appointment, or booking. Our team will review the details and contact you.
                </p>
              </>
            ) : (
              <p className="mt-5 text-muted-foreground">
                {query.duplicate
                  ? "This request was already received. Check your email for its receipt and reference."
                  : "This confirmation link is invalid or expired. If you submitted successfully, check your email for the receipt and reference."}
              </p>
            )}
            <Link
              className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground"
              href="/"
            >
              Return home
            </Link>
          </div>
        </Container>
      </Section>
    </PublicLayout>
  );
}
