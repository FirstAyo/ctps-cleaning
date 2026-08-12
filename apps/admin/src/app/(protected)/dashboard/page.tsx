import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminApi, currentIdentity } from "@/lib/admin-api";
import type { JobListItem } from "@/lib/job-types";
import type { MarketingPageListItem, PublicMediaItem } from "@/lib/marketing-types";

export default async function DashboardPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  const canReadJobs =
    identity.permissions.includes("jobs.read") ||
    identity.permissions.includes("jobs.readAssigned");
  const jobs = canReadJobs
    ? await adminApi<{ items: JobListItem[]; pagination: { total: number } }>(
        "admin/jobs?page=1&pageSize=20&archived=false",
      )
    : null;
  const marketing = identity.permissions.includes("pages.read")
    ? await adminApi<{ items: MarketingPageListItem[] }>("admin/pages")
    : null;
  const publicMedia = identity.permissions.includes("mediaLibrary.read")
    ? await adminApi<{ items: PublicMediaItem[] }>("admin/media-library")
    : null;
  return (
    <div className="grid gap-6">
      <section className="admin-dashboard-hero">
        <p className="eyebrow text-primary">CTPS workspace</p>
        <h2>Good to see you, {identity.displayName}.</h2>
        <p>
          Manage the public experience and operational work from one permission-aware workspace.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {marketing ? (
            <Link
              className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
              href="/pages"
            >
              Edit marketing pages
            </Link>
          ) : null}
          {identity.permissions.includes("quoteRequests.read") ? (
            <Link
              className="rounded-md border border-sidebar-border px-4 py-2 font-semibold"
              href="/quote-requests"
            >
              Review quote requests
            </Link>
          ) : null}
        </div>
      </section>
      {marketing || publicMedia ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketing ? (
            <Link className="admin-metric" href="/pages">
              <span>Marketing pages</span>
              <strong>{marketing.items.length}</strong>
              <small>
                {marketing.items.filter((page) => page.status === "PUBLISHED").length} published
              </small>
            </Link>
          ) : null}
          {publicMedia ? (
            <Link className="admin-metric" href="/media-library">
              <span>Public media</span>
              <strong>{publicMedia.items.length}</strong>
              <small>Isolated marketing assets</small>
            </Link>
          ) : null}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {identity.displayName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>Roles: {identity.roleKeys.join(", ") || "No assigned role"}</p>
          <p>Effective permissions: {identity.permissions.length}</p>
          <p>Session expires: {new Date(identity.session.absoluteExpiresAt).toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Administration foundation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Permission-aware shortcuts to implemented staff workflows.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {identity.permissions.includes("users.read") ? (
              <Link className="underline" href="/users">
                Manage users
              </Link>
            ) : null}
            {identity.permissions.includes("roles.read") ? (
              <Link className="underline" href="/roles">
                Manage roles
              </Link>
            ) : null}
            {identity.permissions.includes("audit.read") ? (
              <Link className="underline" href="/audit-logs">
                View audit logs
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
      {jobs ? (
        <Card>
          <CardHeader>
            <CardTitle>Operational overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Link
              className="rounded-md border border-border p-4"
              href="/jobs?scheduledFrom=2026-01-01T00%3A00%3A00Z"
            >
              <strong>Active jobs</strong>
              <br />
              <span className="text-2xl">
                {
                  jobs.items.filter((job) =>
                    [
                      "SCHEDULED",
                      "CONFIRMED",
                      "EN_ROUTE",
                      "ARRIVED",
                      "IN_PROGRESS",
                      "PAUSED",
                    ].includes(job.status),
                  ).length
                }
              </span>
            </Link>
            <Link
              className="rounded-md border border-border p-4"
              href="/jobs?followUpRequired=true"
            >
              <strong>Follow-up required</strong>
              <br />
              <span className="text-2xl">
                {jobs.items.filter((job) => job.followUpRequired).length}
              </span>
            </Link>
            <Link className="rounded-md border border-border p-4" href="/jobs">
              <strong>Visible jobs</strong>
              <br />
              <span className="text-2xl">{jobs.pagination.total}</span>
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
