import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import Link from "next/link";

/* eslint-disable @next/next/no-img-element -- authenticated managed thumbnail route */

import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogPostAdmin, BlogTaxonomy } from "@/lib/blog-types";

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
    authorUserId?: string;
    categoryId?: string;
    tagId?: string;
    publishedFrom?: string;
    publishedTo?: string;
    scheduledFrom?: string;
    scheduledTo?: string;
  }>;
}) {
  const identity = await currentIdentity();
  if (!identity || (!can(identity, "blogPosts.readOwn") && !can(identity, "blogPosts.readAll")))
    return <Forbidden />;
  const query = await searchParams;
  const params = new URLSearchParams({ page: query.page ?? "1", pageSize: "20" });
  for (const key of [
    "search",
    "status",
    "authorUserId",
    "categoryId",
    "tagId",
    "publishedFrom",
    "publishedTo",
    "scheduledFrom",
    "scheduledTo",
  ] as const)
    if (query[key]) params.set(key, query[key]!);
  const [result, taxonomy, authors] = await Promise.all([
    adminApi<{ items: BlogPostAdmin[]; page: number; total: number }>(`admin/blog/posts?${params}`),
    adminApi<{ categories: BlogTaxonomy[]; tags: BlogTaxonomy[] }>("admin/blog/taxonomy"),
    can(identity, "blogPosts.readAll")
      ? adminApi<{ id: string; displayName: string }[]>("admin/blog/authors")
      : Promise.resolve([]),
  ]);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Blog posts</h2>
          <p className="text-sm text-muted-foreground">
            Create, review, schedule, publish, and archive structured articles.
          </p>
        </div>
        {can(identity, "blogPosts.create") ? (
          <Link href="/blog/posts/new">
            <Button>Create post</Button>
          </Link>
        ) : null}
      </div>
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 xl:grid-cols-5">
        <div>
          <Label htmlFor="blog-search">Search</Label>
          <Input defaultValue={query.search} id="blog-search" name="search" />
        </div>
        {can(identity, "blogPosts.readAll") ? (
          <div>
            <Label htmlFor="blog-author">Author</Label>
            <Select defaultValue={query.authorUserId ?? ""} id="blog-author" name="authorUserId">
              <option value="">All</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.displayName}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div>
          <Label htmlFor="blog-category">Category</Label>
          <Select defaultValue={query.categoryId ?? ""} id="blog-category" name="categoryId">
            <option value="">All</option>
            {taxonomy.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="blog-tag">Tag</Label>
          <Select defaultValue={query.tagId ?? ""} id="blog-tag" name="tagId">
            <option value="">All</option>
            {taxonomy.tags.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="published-from">Published from</Label>
          <Input
            defaultValue={query.publishedFrom}
            id="published-from"
            name="publishedFrom"
            type="date"
          />
        </div>
        <div>
          <Label htmlFor="published-to">Published to</Label>
          <Input
            defaultValue={query.publishedTo}
            id="published-to"
            name="publishedTo"
            type="date"
          />
        </div>
        <div>
          <Label htmlFor="scheduled-from">Scheduled from</Label>
          <Input
            defaultValue={query.scheduledFrom}
            id="scheduled-from"
            name="scheduledFrom"
            type="date"
          />
        </div>
        <div>
          <Label htmlFor="scheduled-to">Scheduled to</Label>
          <Input
            defaultValue={query.scheduledTo}
            id="scheduled-to"
            name="scheduledTo"
            type="date"
          />
        </div>
        <div>
          <Label htmlFor="blog-status">Status</Label>
          <Select defaultValue={query.status ?? ""} id="blog-status" name="status">
            <option value="">All</option>
            {["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </div>
        <Button type="submit">Filter</Button>
      </form>
      {result.items.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">Blog posts</caption>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th>Categories</th>
                <th>Published / scheduled</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((post) => (
                <tr key={post.id}>
                  <td>
                    {post.featuredMedia ? (
                      <img
                        alt=""
                        className="h-14 w-20 rounded-sm object-cover"
                        src={`/api/blog-media/${post.featuredMedia.id}/thumbnail`}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Link className="font-semibold underline" href={`/blog/posts/${post.id}`}>
                      {post.title}
                    </Link>
                    <br />
                    <code className="text-xs">{post.slug}</code>
                  </td>
                  <td>{post.status}</td>
                  <td>{post.author.displayName}</td>
                  <td>{post.categories.map((item) => item.name).join(", ") || "—"}</td>
                  <td>
                    {(post.publishedAt ?? post.scheduledFor)
                      ? new Intl.DateTimeFormat("en-CA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(post.publishedAt ?? post.scheduledFor!))
                      : "—"}
                  </td>
                  <td>
                    {new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(
                      new Date(post.updatedAt),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center">
          No posts match these filters.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Page {result.page}; {result.total} total posts.
      </p>
    </div>
  );
}
