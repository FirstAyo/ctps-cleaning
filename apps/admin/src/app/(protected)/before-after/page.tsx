import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import Link from "next/link";

/* eslint-disable @next/next/no-img-element -- thumbnails are delivered through an authenticated media route */
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { AdminProject } from "@/lib/before-after-types";

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{
    search?: string;
    status?: string;
    serviceKey?: string;
    serviceAreaKey?: string;
    featured?: string;
    page?: string;
  }>;
}) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "projects.beforeAfter.read")) return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({ page: query.page ?? "1", pageSize: "20" });
  for (const key of ["search", "status", "serviceKey", "serviceAreaKey", "featured"] as const)
    if (query[key]) params.set(key, query[key]!);
  const result = await adminApi<{
    items: AdminProject[];
    page: number;
    pageSize: number;
    total: number;
  }>(`admin/before-after-projects?${params}`);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Before & After projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage draft, published, and archived portfolio records.
          </p>
        </div>
        {can(identity, "projects.beforeAfter.create") ? (
          <Link href="/before-after/new">
            <Button>Create project</Button>
          </Link>
        ) : null}
      </div>
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-3 xl:grid-cols-6">
        <div>
          <Label htmlFor="project-search">Search</Label>
          <Input defaultValue={query.search} id="project-search" name="search" />
        </div>
        <div>
          <Label htmlFor="project-status">Status</Label>
          <Select defaultValue={query.status ?? ""} id="project-status" name="status">
            <option value="">All</option>
            <option>DRAFT</option>
            <option>PUBLISHED</option>
            <option>ARCHIVED</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="project-service">Service</Label>
          <Select defaultValue={query.serviceKey ?? ""} id="project-service" name="serviceKey">
            <option value="">All</option>
            <option value="window-cleaning">Window Cleaning</option>
            <option value="pressure-washing">Pressure Washing</option>
            <option value="gutter-cleaning">Gutter Cleaning</option>
            <option value="moss-removal">Moss Removal</option>
            <option value="vent-cleaning">Vent Cleaning</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="project-area">Area</Label>
          <Select defaultValue={query.serviceAreaKey ?? ""} id="project-area" name="serviceAreaKey">
            <option value="">All</option>
            <option value="vancouver">Vancouver</option>
            <option value="richmond">Richmond</option>
            <option value="burnaby">Burnaby</option>
            <option value="surrey">Surrey</option>
            <option value="coquitlam">Coquitlam</option>
            <option value="north-vancouver">North Vancouver</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="project-featured">Featured</Label>
          <Select defaultValue={query.featured ?? ""} id="project-featured" name="featured">
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </Select>
        </div>
        <Button type="submit">Filter</Button>
      </form>
      {result.items.length ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption className="sr-only">Before-and-after projects</caption>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Service / area</th>
                  <th>Featured</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((project) => (
                  <tr key={project.id}>
                    <td>
                      {project.primaryAfterMedia ? (
                        <img
                          alt=""
                          className="h-14 w-20 rounded-sm object-cover"
                          src={`/api/admin-media/${project.primaryAfterMedia.id}/thumbnail`}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image</span>
                      )}
                    </td>
                    <td>
                      <Link
                        className="font-semibold underline"
                        href={`/before-after/${project.id}`}
                      >
                        {project.title}
                      </Link>
                      <br />
                      <code className="text-xs">{project.slug}</code>
                    </td>
                    <td>{project.status}</td>
                    <td>
                      {project.serviceKey}
                      <br />
                      {project.serviceAreaKey}
                    </td>
                    <td>{project.featured ? "Yes" : "No"}</td>
                    <td>
                      {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
                        new Date(project.updatedAt),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Page {result.page}; {result.total} total projects.
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <h3 className="font-semibold">No projects match these filters.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a draft or reset the current filters.
          </p>
        </div>
      )}
    </div>
  );
}
