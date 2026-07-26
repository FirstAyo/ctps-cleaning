import Link from "next/link";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { JobListItem } from "@/lib/job-types";

export default async function JobCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; days?: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "jobs.viewCalendar")) return <Forbidden />;
  const query = await searchParams;
  const days = [1, 7, 31].includes(Number(query.days)) ? Number(query.days) : 7;
  const from =
    query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from)
      ? new Date(`${query.from}T00:00:00-07:00`)
      : new Date();
  const to = new Date(from.getTime() + days * 86_400_000);
  const result = await adminApi<{ items: JobListItem[] }>(
    `admin/jobs/calendar?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
  );
  const groups = Map.groupBy(result.items, (job) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", dateStyle: "full" }).format(
      new Date(job.scheduledStartAt!),
    ),
  );
  return (
    <div className="grid gap-6">
      <header>
        <h2 className="text-2xl font-semibold">Job calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          America/Vancouver schedule. Customer addresses are intentionally omitted.
        </p>
      </header>
      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <label className="grid gap-1 text-sm font-semibold">
          Starting date
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3"
            defaultValue={query.from}
            name="from"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          View
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            defaultValue={String(days)}
            name="days"
          >
            <option value="1">Day</option>
            <option value="7">Week</option>
            <option value="31">Month agenda</option>
          </select>
        </label>
        <button className="min-h-10 rounded-md border border-border px-4 font-semibold">Go</button>
        <Link className="underline" href="/jobs/calendar">
          Today
        </Link>
      </form>
      <div className="grid gap-5" aria-label="Accessible schedule agenda">
        {groups.size ? (
          [...groups.entries()].map(([date, jobs]) => (
            <section className="rounded-lg border border-border bg-card p-5" key={date}>
              <h3 className="text-lg font-semibold">{date}</h3>
              <ul className="mt-3 grid gap-3">
                {jobs.map((job) => (
                  <li className="rounded-md bg-surface-muted p-3" key={job.id}>
                    <Link className="font-semibold underline" href={`/jobs/${job.id}`}>
                      {new Intl.DateTimeFormat("en-CA", {
                        timeZone: "America/Vancouver",
                        timeStyle: "short",
                      }).format(new Date(job.scheduledStartAt!))}{" "}
                      — {job.referenceNumber}
                    </Link>
                    <p className="text-sm">
                      {job.status}; {job.services.map((item) => item.serviceKey).join(", ")};{" "}
                      {job.serviceAreaKey}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned:{" "}
                      {job.assignments.map((item) => item.user.displayName).join(", ") ||
                        "Unassigned"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border p-8 text-center">
            No scheduled jobs in this range.
          </p>
        )}
      </div>
    </div>
  );
}
