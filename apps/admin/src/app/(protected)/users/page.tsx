import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import { Button, Input, Label } from "@ctps/ui/primitives";
import Link from "next/link";
import { CreateUserForm } from "@/components/management-forms";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: { role: { displayName: string } }[];
}
interface Role {
  id: string;
  key: string;
  displayName: string;
}
export default async function UsersPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "users.read")) return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({ page: query.page ?? "1", pageSize: "20" });
  if (query.search) params.set("search", query.search);
  if (query.status === "ACTIVE" || query.status === "DISABLED") params.set("status", query.status);
  const users = await adminApi<{ items: UserRow[]; page: number; pageSize: number; total: number }>(
    `admin/users?${params}`,
  );
  const canCreate =
    can(identity, "users.create") &&
    can(identity, "users.assignRoles") &&
    can(identity, "roles.read");
  const roles = canCreate ? await adminApi<Role[]>("admin/roles") : [];
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff users</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="user-search">Search</Label>
              <Input defaultValue={query.search} id="user-search" name="search" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                className="h-10 rounded-md border bg-background px-3"
                defaultValue={query.status ?? ""}
                id="status"
                name="status"
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
            <Button type="submit">Filter</Button>
          </form>
          {users.items.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {users.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <Link className="font-medium underline" href={`/users/${user.id}`}>
                          {user.displayName}
                        </Link>
                        <br />
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </td>
                      <td>{user.status}</td>
                      <td>{user.roles.map(({ role }) => role.displayName).join(", ") || "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users match these filters.</p>
          )}
          <p className="mt-3 text-sm">
            Page {users.page}; {users.total} total
          </p>
        </CardContent>
      </Card>
      {canCreate ? <CreateUserForm roles={roles} /> : null}
    </div>
  );
}
