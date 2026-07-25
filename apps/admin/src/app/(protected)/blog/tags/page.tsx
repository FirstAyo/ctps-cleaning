import { BlogTaxonomyManager } from "@/components/blog-taxonomy-manager";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogTaxonomy } from "@/lib/blog-types";
export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "blogTags.manage")) return <Forbidden />;
  const data = await adminApi<{ tags: BlogTaxonomy[] }>("admin/blog/taxonomy");
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Blog tags</h2>
        <p className="text-sm text-muted-foreground">Maintain reusable article labels.</p>
      </div>
      <BlogTaxonomyManager initialItems={data.tags} kind="tags" />
    </div>
  );
}
