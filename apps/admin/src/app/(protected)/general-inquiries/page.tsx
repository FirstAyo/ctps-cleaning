import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import Link from "next/link";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { GeneralInquiryListItem } from "@/lib/general-inquiry-types";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; archived?: string; page?: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "generalInquiries.read")) return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({
    page: /^[1-9]\d*$/.test(query.page ?? "") ? query.page! : "1",
    pageSize: "20",
    archived: query.archived === "true" ? "true" : "false",
  });
  if (query.search) params.set("search", query.search);
  if (query.status === "NEW" || query.status === "READ") params.set("status", query.status);
  const result = await adminApi<{
    items: GeneralInquiryListItem[];
    pagination: { page: number; pageSize: number; total: number };
  }>(`admin/general-inquiries?${params}`);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review private general inquiries. Detailed quote requests remain in their own workspace.
        </p>
      </div>
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
        <div>
          <Label htmlFor="inquiry-search">Search</Label>
          <Input
            defaultValue={query.search}
            id="inquiry-search"
            name="search"
            placeholder="Name, email, or message"
          />
        </div>
        <div>
          <Label htmlFor="inquiry-status">Status</Label>
          <Select defaultValue={query.status ?? ""} id="inquiry-status" name="status">
            <option value="">All statuses</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="inquiry-archived">Records</Label>
          <Select defaultValue={query.archived ?? "false"} id="inquiry-archived" name="archived">
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
              <caption className="sr-only">General customer inquiries</caption>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Message</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>
                      <Link
                        className="font-semibold underline"
                        href={`/general-inquiries/${inquiry.id}`}
                      >
                        {inquiry.name}
                      </Link>
                      <br />
                      <span className="text-xs text-muted-foreground">{inquiry.email}</span>
                    </td>
                    <td>
                      {inquiry.message.length > 100
                        ? `${inquiry.message.slice(0, 100)}â€¦`
                        : inquiry.message}
                    </td>
                    <td>{inquiry.serviceKey ?? "General"}</td>
                    <td>{inquiry.status === "NEW" ? "New" : "Read"}</td>
                    <td>
                      {new Intl.DateTimeFormat("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(inquiry.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Page {result.pagination.page}; {result.pagination.total} total messages.
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <h3 className="font-semibold">No messages match these filters.</h3>
        </div>
      )}
    </div>
  );
}
