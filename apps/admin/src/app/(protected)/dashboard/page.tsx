import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentIdentity } from "@/lib/admin-api";

export default async function DashboardPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
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
            Quote, estimator, blog, media, and project modules intentionally arrive in later phases.
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
    </div>
  );
}
