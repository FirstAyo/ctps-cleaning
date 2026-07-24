import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import { Button, Input, Label } from "@ctps/ui/primitives";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";

interface AuditRow {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { displayName: string; email: string } | null;
}
export default async function AuditLogsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    action?: string;
    resourceType?: string;
    actorUserId?: string;
    page?: string;
  }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "audit.read")) return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({ page: query.page ?? "1", pageSize: "25" });
  for (const key of ["action", "resourceType", "actorUserId"] as const)
    if (query[key]) params.set(key, query[key]!);
  const logs = await adminApi<{ items: AuditRow[]; total: number; page: number }>(
    `admin/audit-logs?${params}`,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Read-only audit log</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="action">Action</Label>
            <Input defaultValue={query.action} id="action" name="action" />
          </div>
          <div>
            <Label htmlFor="resourceType">Resource type</Label>
            <Input defaultValue={query.resourceType} id="resourceType" name="resourceType" />
          </div>
          <Button type="submit">Filter</Button>
        </form>
        {logs.items.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Safe metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.items.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      {log.actor ? `${log.actor.displayName} (${log.actor.email})` : "System"}
                    </td>
                    <td>
                      <code>{log.action}</code>
                    </td>
                    <td>
                      {log.resourceType}
                      {log.resourceId ? `: ${log.resourceId}` : ""}
                    </td>
                    <td>
                      <details>
                        <summary>View</summary>
                        <pre className="max-w-sm overflow-auto text-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No audit events match these filters.</p>
        )}
        <p className="mt-3 text-sm">
          Page {logs.page}; {logs.total} total
        </p>
      </CardContent>
    </Card>
  );
}
