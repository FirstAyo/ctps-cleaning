import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import Link from "next/link";
import { CreateRoleForm } from "@/components/management-forms";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";

interface Role {
  id: string;
  key: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  _count: { users: number };
  permissions: unknown[];
}
export default async function RolesPage() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "roles.read")) return <Forbidden />;
  const roles = await adminApi<Role[]>("admin/roles");
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles and permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {roles.map((role) => (
              <Link
                className="rounded-md border p-4 hover:bg-muted"
                href={`/roles/${role.id}`}
                key={role.id}
              >
                <strong>{role.displayName}</strong> <code className="text-xs">{role.key}</code>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <p className="mt-1 text-xs">
                  {role.isSystem ? "Protected system role" : "Custom role"} · {role._count.users}{" "}
                  user(s) · {role.permissions.length} permission(s)
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      {can(identity, "roles.create") ? <CreateRoleForm /> : null}
    </div>
  );
}
