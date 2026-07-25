import Link from "next/link";
import { Button, Label, Select } from "@ctps/ui/primitives";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
type Item = {
  id: string;
  serviceKey: string;
  customerType: string;
  serviceAreaKey: string;
  outcome: string;
  minimumCents: number | null;
  maximumCents: number | null;
  currency: string;
  pricingVersionCode: string;
  createdAt: string;
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ serviceKey?: string; outcome?: string; archived?: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "estimatorResults.read")) return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({
    page: "1",
    pageSize: "20",
    archived: query.archived === "true" ? "true" : "false",
  });
  if (query.serviceKey) params.set("serviceKey", query.serviceKey);
  if (query.outcome) params.set("outcome", query.outcome);
  const result = await adminApi<{ items: Item[]; pagination: { total: number } }>(
    `admin/estimator-results?${params}`,
  );
  const money = (value: number | null) =>
    value === null
      ? "—"
      : new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: "CAD",
          maximumFractionDigits: 0,
        }).format(value / 100);
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Estimator results</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stored snapshots remain tied to their historical pricing version.
        </p>
      </div>
      <form className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
        <label>
          <Label>Service</Label>
          <Select name="serviceKey" defaultValue={query.serviceKey ?? ""}>
            <option value="">All</option>
            {[
              "window-cleaning",
              "pressure-washing",
              "gutter-cleaning",
              "moss-removal",
              "vent-cleaning",
            ].map((key) => (
              <option key={key}>{key}</option>
            ))}
          </Select>
        </label>
        <label>
          <Label>Outcome</Label>
          <Select name="outcome" defaultValue={query.outcome ?? ""}>
            <option value="">All</option>
            <option>RANGE</option>
            <option>MANUAL_REVIEW</option>
          </Select>
        </label>
        <Button type="submit">Filter</Button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Service / area</th>
              <th>Outcome</th>
              <th>Range</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link className="font-semibold underline" href={`/estimator-results/${item.id}`}>
                    {new Date(item.createdAt).toLocaleString("en-CA")}
                  </Link>
                </td>
                <td>
                  {item.serviceKey}
                  <br />
                  {item.customerType} · {item.serviceAreaKey}
                </td>
                <td>{item.outcome}</td>
                <td>
                  {item.outcome === "RANGE"
                    ? `${money(item.minimumCents)}–${money(item.maximumCents)}`
                    : "Manual review"}
                </td>
                <td>
                  <code>{item.pricingVersionCode}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">{result.pagination.total} result records.</p>
    </div>
  );
}
