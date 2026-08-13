import Link from "next/link";
import { Container, Section } from "@ctps/ui/layout";
import { PublicLayout } from "@/components/public-shell";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata(
  "Page Not Found",
  "The requested CTPS page is unavailable.",
);

export default function NotFound() {
  return (
    <PublicLayout>
      <Section>
        <Container className="max-w-2xl">
          <p className="overline">Not found</p>
          <h1 className="public-heading mt-3">That page is unavailable.</h1>
          <p className="mt-4 text-muted-foreground">
            The address may have changed or the content may no longer be published.
          </p>
          <Link className="mt-6 inline-block font-semibold text-primary" href="/">
            Return home
          </Link>
        </Container>
      </Section>
    </PublicLayout>
  );
}
