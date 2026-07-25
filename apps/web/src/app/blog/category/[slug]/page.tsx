import { notFound } from "next/navigation";
import { BlogListing } from "@/components/blog";
import { PublicLayout } from "@/components/public-shell";
import { getBlogPosts, getBlogTaxonomy } from "@/lib/blog-api";
import { metadataFor } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const item = (await getBlogTaxonomy()).categories.find(
    (candidate) => candidate.slug === slug && candidate._count.posts > 0,
  );
  return item
    ? metadataFor(
        `${item.name} Articles`,
        item.description || `Published CTPS articles in ${item.name}.`,
        `/blog/category/${slug}`,
      )
    : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const taxonomy = await getBlogTaxonomy();
  const category = taxonomy.categories.find((item) => item.slug === slug && item._count.posts > 0);
  if (!category) notFound();
  const result = await getBlogPosts({ category: slug, pageSize: "24" });
  return (
    <PublicLayout>
      <BlogListing
        description={category.description || `Published CTPS articles in ${category.name}.`}
        posts={result.items}
        title={category.name}
      />
    </PublicLayout>
  );
}
