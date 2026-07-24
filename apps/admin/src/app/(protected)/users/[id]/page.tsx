import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import { Forbidden } from "@/components/forbidden";
import { UserControls } from "@/components/management-forms";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";

interface UserDetail {
  id: string;
  email: string;
  displayName: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  mustChangePassword: boolean;
  roles: { role: { id: string; key: string; displayName: string } }[];
}
interface Role {
  id: string;
  key: string;
  displayName: string;
}
export default async function UserDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "users.read")) return <Forbidden />;
  const { id } = await params;
  const user = await adminApi<UserDetail>(`admin/users/${encodeURIComponent(id)}`);
  const roles = can(identity, "users.assignRoles") ? await adminApi<Role[]>("admin/roles") : [];
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{user.displayName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm">
          <p>{user.email}</p>
          <p>Status: {user.status}</p>
          <p>Must change password: {user.mustChangePassword ? "Yes" : "No"}</p>
          <p>
            Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
          </p>
          <p>Created: {new Date(user.createdAt).toLocaleString()}</p>
        </CardContent>
      </Card>
      {can(identity, "users.update") ||
      can(identity, "users.assignRoles") ||
      can(identity, "users.disable") ? (
        <UserControls
          canAssignRoles={can(identity, "users.assignRoles")}
          canDisable={can(identity, "users.disable")}
          canUpdate={can(identity, "users.update")}
          roles={roles}
          user={{
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            status: user.status,
            roleIds: user.roles.map(({ role }) => role.id),
          }}
        />
      ) : null}
    </div>
  );
}
