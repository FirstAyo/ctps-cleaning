import Link from "next/link";
import { Button } from "@ctps/ui/primitives";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
type Version = {
  id: string;
  versionCode: string;
  name: string;
  status: string;
  effectiveFrom: string | null;
  updatedAt: string;
  _count: { configurations: number; estimates: number };
};
export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "pricingVersions.read")) return <Forbidden />;
  const versions = await adminApi<Version[]>("admin/pricing/versions");
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Pricing versions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft safely, preview deterministic calculations, then publish an effective immutable
            version.
          </p>
        </div>
        {can(identity, "pricingVersions.create") ? (
          <Link href="/pricing/versions/new">
            <Button>Create pricing draft</Button>
          </Link>
        ) : null}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
              <th>Effective</th>
              <th>Services</th>
              <th>Historical results</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.id}>
                <td>
                  <Link
                    className="font-semibold underline"
                    href={`/pricing/versions/${version.id}`}
                  >
                    {version.name}
                  </Link>
                  <br />
                  <code className="text-xs">{version.versionCode}</code>
                </td>
                <td>{version.status}</td>
                <td>
                  {version.effectiveFrom
                    ? new Date(version.effectiveFrom).toLocaleString("en-CA")
                    : "Not set"}
                </td>
                <td>{version._count.configurations}/5</td>
                <td>{version._count.estimates}</td>
                <td>{new Date(version.updatedAt).toLocaleString("en-CA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!versions.length ? (
        <p className="rounded-lg border border-dashed p-6">
          No pricing versions exist. Create a draft; public estimation remains safely unavailable
          until an approved version is published.
        </p>
      ) : null}
    </div>
  );
}
