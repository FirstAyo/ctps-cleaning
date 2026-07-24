import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import { Forbidden } from "@/components/forbidden";
import { RoleControls } from "@/components/management-forms";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";

interface RoleDetail {
  id: string;
  key: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissions: { permission: { key: string } }[];
}
interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
  group: string;
}
export default async function RoleDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "roles.read")) return <Forbidden />;
  const { id } = await params;
  const role = await adminApi<RoleDetail>(`admin/roles/${encodeURIComponent(id)}`);
  const permissions = await adminApi<Permission[]>("admin/permissions");
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{role.displayName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{role.description}</p>
          <code>{role.key}</code>
        </CardContent>
      </Card>
      {can(identity, "roles.update") || can(identity, "roles.assignPermissions") ? (
        <RoleControls
          canAssignPermissions={can(identity, "roles.assignPermissions")}
          canUpdate={can(identity, "roles.update")}
          permissions={permissions.map((permission) => ({
            ...permission,
            displayName: permission.label,
          }))}
          role={{
            ...role,
            permissionKeys: role.permissions.map(({ permission }) => permission.key),
          }}
        />
      ) : null}
    </div>
  );
}
