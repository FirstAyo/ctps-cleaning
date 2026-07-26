import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminApi, currentIdentity } from "@/lib/admin-api";
import type { JobListItem } from "@/lib/job-types";

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
  return (
    <div className="grid gap-6">
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
