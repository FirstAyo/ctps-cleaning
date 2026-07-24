import type { FoundationHealthStatus } from "@ctps/types";
import { StatusBadge } from "@ctps/ui";

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
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section
        aria-labelledby="foundation-title"
        className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">CTPS Admin</p>
        <h1
          id="foundation-title"
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-950"
        >
          Admin Application Foundation
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          This route is an unprotected Phase 1 status page. Authentication and admin functionality
          are not implemented yet.
        </p>
        <dl className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-600">Environment</dt>
            <dd className="mt-1 text-base text-slate-950">{environment}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Foundation phase</dt>
            <dd className="mt-1 text-base text-slate-950">Phase 1</dd>
          </div>
        </dl>
        <div aria-label="Service health" className="mt-8 flex flex-wrap gap-3">
          <StatusBadge label={labels.api[health.api]} state={health.api} />
          <StatusBadge label={labels.database[health.database]} state={health.database} />
        </div>
      </section>
    </main>
  );
}
