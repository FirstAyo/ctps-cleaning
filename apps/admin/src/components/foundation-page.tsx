import type { FoundationHealthStatus } from "@ctps/types";
import { Alert } from "@ctps/ui/content";
import { Container } from "@ctps/ui/layout";
import { LinkButton } from "@ctps/ui/primitives";
import { StatusBadge } from "@ctps/ui/status-badge";
import { ThemeToggle } from "@ctps/ui/theme";

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
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <Container size="reading">
        <section
          aria-labelledby="foundation-title"
          className="rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">CTPS Admin</p>
            <ThemeToggle />
          </div>
          <h1 className="admin-page-heading mt-4" id="foundation-title">
            Admin design foundation
          </h1>
          <Alert className="mt-5" title="Authentication is not implemented" tone="warning">
            This is an unprotected Phase 2 status page. The shell preview is not secured and
            contains no business data or admin functionality.
          </Alert>
          <p className="mt-5 text-muted-foreground">
            Phase 2 provides shared visual and interaction patterns only. Protected routes, users,
            roles, permissions, and real administration remain Phase 3 or later work.
          </p>
          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Environment</dt>
              <dd className="font-semibold">{environment}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Foundation phase</dt>
              <dd className="font-semibold">Phase 2</dd>
            </div>
          </dl>
          <div aria-label="Service health" className="mt-7 flex flex-wrap gap-3">
            <StatusBadge label={labels.api[health.api]} state={health.api} />
            <StatusBadge label={labels.database[health.database]} state={health.database} />
          </div>
          <div className="mt-7">
            <LinkButton href="/design-system">Review admin components</LinkButton>
          </div>
        </section>
      </Container>
    </main>
  );
}
