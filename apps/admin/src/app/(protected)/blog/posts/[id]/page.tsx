import { BlogPostEditor } from "@/components/blog-post-editor";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogPostAdmin, BlogTaxonomy } from "@/lib/blog-types";

export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || (!can(identity, "blogPosts.readOwn") && !can(identity, "blogPosts.readAll")))
    return <Forbidden />;
  const { id } = await params;
  const [post, taxonomy, revisions] = await Promise.all([
    adminApi<BlogPostAdmin>(`admin/blog/posts/${id}`),
    adminApi<{ categories: BlogTaxonomy[]; tags: BlogTaxonomy[] }>("admin/blog/taxonomy"),
    can(identity, "blogRevisions.readOwn") || can(identity, "blogRevisions.readAll")
      ? adminApi<
          {
            id: string;
            revisionNumber: number;
            title: string;
            excerpt: string;
            statusSnapshot: string;
            createdAt: string;
            actor: { displayName: string };
          }[]
        >(`admin/blog/posts/${id}/revisions`)
      : Promise.resolve([]),
  ]);
  const own = post.authorUserId === identity.id;
  if (!(can(identity, "blogPosts.updateAll") || (own && can(identity, "blogPosts.updateOwn"))))
    return (
      <div className="rounded-lg border p-6">
        <h2 className="text-2xl font-semibold">{post.title}</h2>
        <p>{post.status} · Read-only access</p>
      </div>
    );
  return (
    <div className="grid gap-8">
      <BlogPostEditor
        post={post}
        categories={taxonomy.categories}
        tags={taxonomy.tags}
        canPublish={can(identity, own ? "blogPosts.publishOwn" : "blogPosts.publishAll")}
        canSchedule={can(identity, own ? "blogPosts.scheduleOwn" : "blogPosts.scheduleAll")}
        canArchive={can(identity, own ? "blogPosts.archiveOwn" : "blogPosts.archiveAll")}
        canDelete={can(identity, own ? "blogPosts.deleteOwn" : "blogPosts.deleteAll")}
        canUpload={can(identity, "blogMedia.uploadOwn")}
        canUpdateMedia={can(identity, own ? "blogMedia.updateOwn" : "blogMedia.updateAll")}
        canDeleteMedia={can(identity, own ? "blogMedia.deleteOwn" : "blogMedia.deleteAll")}
      />
      {revisions.length ? (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-xl font-semibold">Revision history</h2>
          <div className="admin-table-wrap mt-4">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Revision</th>
                  <th>Title snapshot</th>
                  <th>Status</th>
                  <th>Actor</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map((revision) => (
                  <tr key={revision.id}>
                    <td>{revision.revisionNumber}</td>
                    <td>
                      {revision.title}
                      <br />
                      <span className="text-xs text-muted-foreground">{revision.excerpt}</span>
                    </td>
                    <td>{revision.statusSnapshot}</td>
                    <td>{revision.actor.displayName}</td>
                    <td>
                      {new Intl.DateTimeFormat("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(revision.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
