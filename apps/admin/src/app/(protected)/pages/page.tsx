import { Card, CardContent } from "@ctps/ui/content";
import Link from "next/link";
import { redirect } from "next/navigation";

import { adminApi, currentIdentity } from "@/lib/admin-api";
import type { MarketingPageListItem } from "@/lib/marketing-types";

export default async function PagesPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  if (!identity.permissions.includes("pages.read"))
    return <p>You do not have access to marketing pages.</p>;
  const { items } = await adminApi<{ items: MarketingPageListItem[] }>("admin/pages");
  return (
    <div className="grid gap-5">
      <div>
        <p className="eyebrow">Website</p>
        <h2 className="mt-2 text-3xl font-semibold">Marketing pages</h2>
        <p className="mt-2 text-muted-foreground">
          Edit approved structured sections without changing routes or injecting code.
        </p>
      </div>
      <Card>
        <CardContent className="admin-table-wrap p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((page) => (
                <tr key={page.pageKey}>
                  <td>
                    <strong>{page.title}</strong>
                    <br />
                    <span className="text-xs text-muted-foreground">{page.slug}</span>
                  </td>
                  <td>{page.pageType}</td>
                  <td>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-semibold">
                      {page.status}
                    </span>
                  </td>
                  <td>
                    {new Date(page.updatedAt).toLocaleString()}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      by {page.updatedBy.displayName}
                    </span>
                  </td>
                  <td>
                    <Link className="font-semibold text-primary" href={`/pages/${page.pageKey}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
