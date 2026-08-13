import { BlogPostEditor } from "@/components/blog-post-editor";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogMedia, BlogPostAdmin, BlogTaxonomy } from "@/lib/blog-types";

export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || (!can(identity, "blogPosts.readOwn") && !can(identity, "blogPosts.readAll")))
    return <Forbidden />;
  const { id } = await params;
  const [post, taxonomy, revisions, media] = await Promise.all([
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
    can(identity, "blogMedia.readOwn") || can(identity, "blogMedia.readAll")
      ? adminApi<{ items: BlogMedia[] }>("admin/blog/media?page=1&pageSize=48")
      : Promise.resolve({ items: [] }),
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
        libraryMedia={media.items}
        revisions={revisions}
        canPublish={can(identity, own ? "blogPosts.publishOwn" : "blogPosts.publishAll")}
        canSchedule={can(identity, own ? "blogPosts.scheduleOwn" : "blogPosts.scheduleAll")}
        canArchive={can(identity, own ? "blogPosts.archiveOwn" : "blogPosts.archiveAll")}
        canDelete={can(identity, own ? "blogPosts.deleteOwn" : "blogPosts.deleteAll")}
        canUpload={can(identity, "blogMedia.uploadOwn")}
        canUpdateMedia={can(identity, own ? "blogMedia.updateOwn" : "blogMedia.updateAll")}
        canRestoreRevision={can(identity, own ? "blogRevisions.readOwn" : "blogRevisions.readAll")}
      />
    </div>
  );
}
