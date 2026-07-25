import { BlogTaxonomyManager } from "@/components/blog-taxonomy-manager";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { BlogTaxonomy } from "@/lib/blog-types";
export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "blogCategories.manage")) return <Forbidden />;
  const data = await adminApi<{ categories: BlogTaxonomy[] }>("admin/blog/taxonomy");
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Blog categories</h2>
        <p className="text-sm text-muted-foreground">
          Organize articles into durable public topics.
        </p>
      </div>
      <BlogTaxonomyManager initialItems={data.categories} kind="categories" />
    </div>
  );
}
