import { notFound } from "next/navigation";
import { BlogListing } from "@/components/blog";
import { PublicLayout } from "@/components/public-shell";
import { getBlogPosts, getBlogTaxonomy } from "@/lib/blog-api";
import { noIndexFollowMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const item = (await getBlogTaxonomy()).tags.find(
    (candidate) => candidate.slug === slug && candidate._count.posts > 0,
  );
  return item
    ? noIndexFollowMetadata(
        `#${item.name} Articles`,
        `Published CTPS articles tagged ${item.name}.`,
      )
    : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const tag = (await getBlogTaxonomy()).tags.find(
    (item) => item.slug === slug && item._count.posts > 0,
  );
  if (!tag) notFound();
  const result = await getBlogPosts({ tag: slug, pageSize: "24" });
  return (
    <PublicLayout>
      <BlogListing
        description={`Published CTPS articles tagged ${tag.name}.`}
        posts={result.items}
        title={`#${tag.name}`}
      />
    </PublicLayout>
  );
}
