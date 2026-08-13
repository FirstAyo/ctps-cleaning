import { BlogPostEditor } from "@/components/blog-post-editor";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogMedia, BlogTaxonomy } from "@/lib/blog-types";

export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "blogPosts.create")) return <Forbidden />;
  const [taxonomy, media] = await Promise.all([
    adminApi<{ categories: BlogTaxonomy[]; tags: BlogTaxonomy[] }>("admin/blog/taxonomy"),
    can(identity, "blogMedia.readOwn") || can(identity, "blogMedia.readAll")
      ? adminApi<{ items: BlogMedia[] }>("admin/blog/media?page=1&pageSize=48")
      : Promise.resolve({ items: [] }),
  ]);
  return (
    <BlogPostEditor
      categories={taxonomy.categories}
      tags={taxonomy.tags}
      libraryMedia={media.items}
      canPublish={false}
      canSchedule={false}
      canArchive={false}
      canDelete={false}
      canUpload={can(identity, "blogMedia.uploadOwn")}
      canUpdateMedia={can(identity, "blogMedia.updateOwn") || can(identity, "blogMedia.updateAll")}
    />
  );
}
