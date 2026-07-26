import Link from "next/link";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { JobListItem } from "@/lib/job-types";

const statuses = [
  "DRAFT",
  "READY_TO_SCHEDULE",
  "SCHEDULED",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "FOLLOW_UP_REQUIRED",
  "CANCELLED",
  "CLOSED",
  "ARCHIVED",
];
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const identity = await currentIdentity();
  if (!identity || (!can(identity, "jobs.read") && !can(identity, "jobs.readAssigned")))
    return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({
    page: /^\d+$/.test(query.page ?? "") ? query.page! : "1",
    pageSize: "20",
    archived: query.archived === "true" ? "true" : "false",
  });
  for (const key of [
    "search",
    "status",
    "serviceKey",
    "serviceAreaKey",
    "assignedUserId",
    "scheduledFrom",
    "scheduledTo",
    "followUpRequired",
  ] as const)
    if (query[key]) params.set(key, query[key]!);
  const result = await adminApi<{
    items: JobListItem[];
    pagination: { page: number; pageSize: number; total: number };
  }>(`admin/jobs?${params}`);
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Vancouver",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "Not scheduled";
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Operational jobs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Private staff scheduling and service-fulfilment records.
          </p>
        </div>
        {can(identity, "jobs.createInternal") || can(identity, "jobs.createFromQuote") ? (
          <Link
            className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
            href="/jobs/new"
          >
            Create Job
          </Link>
        ) : null}
      </header>
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <label className="grid gap-1 text-sm font-semibold">
          Search
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3"
            defaultValue={query.search}
            name="search"
            placeholder="Reference or customer"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Status
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            defaultValue={query.status ?? ""}
            name="status"
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Service area
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            defaultValue={query.serviceAreaKey ?? ""}
            name="serviceAreaKey"
          >
            <option value="">All areas</option>
            {["vancouver", "richmond", "burnaby", "surrey", "coquitlam", "north-vancouver"].map(
              (area) => (
                <option key={area}>{area}</option>
              ),
            )}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Follow-up
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            defaultValue={query.followUpRequired ?? ""}
            name="followUpRequired"
          >
            <option value="">Either</option>
            <option value="true">Required</option>
            <option value="false">Not required</option>
          </select>
        </label>
        <button
          className="min-h-10 rounded-md border border-border px-4 font-semibold"
          type="submit"
        >
          Apply filters
        </button>
        <Link className="self-center underline" href="/jobs">
          Reset
        </Link>
        {can(identity, "jobs.viewCalendar") ? (
          <Link className="self-center underline" href="/jobs/calendar">
            Open calendar
          </Link>
        ) : null}
      </form>
      {result.items.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">Private operational jobs</caption>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Area</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Assigned staff</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link className="font-semibold underline" href={`/jobs/${job.id}`}>
                      {job.referenceNumber}
                    </Link>
                  </td>
                  <td>{job.customerNameSnapshot}</td>
                  <td>{job.services.map(({ serviceKey }) => serviceKey).join(", ")}</td>
                  <td>{job.serviceAreaKey}</td>
                  <td>{date(job.scheduledStartAt)}</td>
                  <td>{job.status}</td>
                  <td>
                    {job.assignments.map(({ user }) => user.displayName).join(", ") || "Unassigned"}
                  </td>
                  <td>{job.followUpRequired ? "Required" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-border p-8 text-center">
          <h3 className="font-semibold">No jobs match these filters.</h3>
        </section>
      )}
      <p className="text-sm text-muted-foreground">
        Page {result.pagination.page}; {result.pagination.total} total jobs.
      </p>
    </div>
  );
}
