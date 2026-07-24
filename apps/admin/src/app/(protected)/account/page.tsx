import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth-forms";
import { RevokeOtherSessionsButton } from "@/components/session-controls";
import { adminApi, currentIdentity } from "@/lib/admin-api";

interface SessionSummary {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  absoluteExpiresAt: string;
  current: boolean;
}
export default async function AccountPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  const sessions = await adminApi<{ items: SessionSummary[] }>("auth/sessions");
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            <strong>Name:</strong> {identity.displayName}
          </p>
          <p>
            <strong>Email:</strong> {identity.email}
          </p>
          <p>
            <strong>Roles:</strong> {identity.roleKeys.join(", ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="underline" href="/change-password">
              Change password
            </Link>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {sessions.items.map((session) => (
              <li className="rounded-md border p-3 text-sm" key={session.id}>
                <strong>{session.current ? "Current session" : "Other session"}</strong>
                <br />
                Last active {new Date(session.lastActivityAt).toLocaleString()}
                <br />
                Expires {new Date(session.absoluteExpiresAt).toLocaleString()}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <RevokeOtherSessionsButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
