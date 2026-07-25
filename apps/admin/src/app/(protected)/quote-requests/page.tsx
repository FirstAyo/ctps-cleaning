import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import Link from "next/link";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { QuoteListItem } from "@/lib/quote-request-types";

const statuses = [
  "NEW",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "ESTIMATE_REVIEWED",
  "QUOTE_PREPARED",
  "CONTACTED",
  "ACCEPTED",
  "DECLINED",
  "CLOSED",
  "CANCELLED",
];
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; archived?: string; page?: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "quoteRequests.read")) return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({
    page: /^[1-9]\d*$/.test(query.page ?? "") ? query.page! : "1",
    pageSize: "20",
    archived: query.archived === "true" ? "true" : "false",
  });
  if (query.search) params.set("search", query.search);
  if (statuses.includes(query.status ?? "")) params.set("status", query.status!);
  const result = await adminApi<{
    items: QuoteListItem[];
    pagination: { page: number; pageSize: number; total: number };
  }>(`admin/quote-requests?${params}`);
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Quote requests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review private guest inquiries, assignments, status, notes, and uploads.
        </p>
      </div>
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
        <div>
          <Label htmlFor="quote-search">Search</Label>
          <Input
            defaultValue={query.search}
            id="quote-search"
            name="search"
            placeholder="Reference, name, or email"
          />
        </div>
        <div>
          <Label htmlFor="quote-status">Status</Label>
          <Select defaultValue={query.status ?? ""} id="quote-status" name="status">
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="quote-archived">Records</Label>
          <Select defaultValue={query.archived ?? "false"} id="quote-archived" name="archived">
            <option value="false">Active</option>
            <option value="true">Archived</option>
          </Select>
        </div>
        <Button type="submit">Filter</Button>
      </form>
      {result.items.length ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption className="sr-only">Customer quote requests</caption>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Property / services</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <Link
                        className="font-semibold underline"
                        href={`/quote-requests/${quote.id}`}
                      >
                        {quote.reference}
                      </Link>
                    </td>
                    <td>
                      {quote.customerName}
                      <br />
                      <span className="text-xs text-muted-foreground">{quote.customerEmail}</span>
                    </td>
                    <td>
                      {quote.propertyType}
                      <br />
                      <span className="text-xs">{quote.services.join(", ")}</span>
                    </td>
                    <td>{quote.status}</td>
                    <td>{quote.assignedTo?.displayName ?? "Unassigned"}</td>
                    <td>
                      {new Intl.DateTimeFormat("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(quote.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Page {result.pagination.page}; {result.pagination.total} total requests.
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <h3 className="font-semibold">No quote requests match these filters.</h3>
        </div>
      )}
    </div>
  );
}
