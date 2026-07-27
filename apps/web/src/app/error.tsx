"use client";
import { useEffect } from "react";
import { Button } from "@ctps/ui/primitives";
import { Container, Section } from "@ctps/ui/layout";

export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    void error.digest;
  }, [error]);
  return (
    <main id="main-content">
      <Section>
        <Container className="max-w-2xl">
          <p className="overline">Temporary error</p>
          <h1 className="public-heading mt-3">This page could not be loaded.</h1>
          <p className="mt-4 text-muted-foreground">
            Try the request again. No form success should be assumed unless it was explicitly
            confirmed.
          </p>
          <Button className="mt-6" onClick={reset}>
            Try again
          </Button>
        </Container>
      </Section>
    </main>
  );
}
