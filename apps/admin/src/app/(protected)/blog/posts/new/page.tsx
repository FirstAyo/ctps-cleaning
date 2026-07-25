import { BlogPostEditor } from "@/components/blog-post-editor";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogTaxonomy } from "@/lib/blog-types";

export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "blogPosts.create")) return <Forbidden />;
  const taxonomy = await adminApi<{ categories: BlogTaxonomy[]; tags: BlogTaxonomy[] }>(
    "admin/blog/taxonomy",
  );
  return (
    <BlogPostEditor
      categories={taxonomy.categories}
      tags={taxonomy.tags}
      canPublish={false}
      canSchedule={false}
      canArchive={false}
      canDelete={false}
      canUpload={can(identity, "blogMedia.uploadOwn")}
      canUpdateMedia={can(identity, "blogMedia.updateOwn") || can(identity, "blogMedia.updateAll")}
      canDeleteMedia={can(identity, "blogMedia.deleteOwn") || can(identity, "blogMedia.deleteAll")}
    />
  );
}
