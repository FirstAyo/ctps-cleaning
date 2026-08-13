import { notFound } from "next/navigation";
import { BlogListing } from "@/components/blog";
import { PublicLayout } from "@/components/public-shell";
import { getBlogAuthor } from "@/lib/blog-api";
import { noIndexFollowMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getBlogAuthor((await params).slug);
  return result
    ? noIndexFollowMetadata(`${result.author.displayName}, CTPS Author`, result.author.bio)
    : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getBlogAuthor((await params).slug);
  if (!result || !result.posts.length) notFound();
  return (
    <PublicLayout>
      <BlogListing
        description={result.author.bio}
        image={result.author.profileMedia}
        posts={result.posts}
        title={result.author.displayName}
      />
    </PublicLayout>
  );
}
