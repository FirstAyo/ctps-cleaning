import type { FoundationHealthStatus } from "@ctps/types";
import { Container } from "@ctps/ui/layout";
import { LinkButton } from "@ctps/ui/primitives";
import { StatusBadge } from "@ctps/ui/status-badge";

import { PublicFooter, PublicHeader } from "./public-shell";

interface FoundationPageProps {
  readonly environment: string;
  readonly health: FoundationHealthStatus;
}
const labels = {
  api: {
    available: "API reachable",
    unavailable: "API unavailable",
    unknown: "API status unknown",
  },
  database: {
    available: "Database ready",
    unavailable: "Database unavailable",
    unknown: "Database status unknown",
  },
} as const;

export function FoundationPage({ environment, health }: FoundationPageProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <PublicHeader />
      <main className="min-h-[70vh] overflow-hidden py-16 sm:py-24" id="main-content">
        <Container>
          <section
            aria-labelledby="foundation-title"
            className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card p-7 shadow-[var(--shadow-md)] sm:p-12"
          >
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                CTPS — Clean Precision
              </p>
              <h1 className="public-display mt-4" id="foundation-title">
                Premium public design foundation
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Phase 2 establishes reusable visual and interaction patterns. This is not the final
                CTPS homepage, and public business features are not implemented yet.
              </p>
              <div className="mt-8">
                <LinkButton href="/design-system">Review the design system</LinkButton>
              </div>
              <dl className="mt-10 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Environment</dt>
                  <dd className="mt-1 font-semibold">{environment}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Foundation phase</dt>
                  <dd className="mt-1 font-semibold">Phase 2</dd>
                </div>
              </dl>
              <div aria-label="Service health" className="mt-8 flex flex-wrap gap-3">
                <StatusBadge label={labels.api[health.api]} state={health.api} />
                <StatusBadge label={labels.database[health.database]} state={health.database} />
              </div>
            </div>
          </section>
        </Container>
      </main>
      <PublicFooter />
    </>
  );
}
