import { notFound, permanentRedirect } from "next/navigation";
import { BlogArticle } from "@/components/blog";
import { PublicLayout } from "@/components/public-shell";
import { getBlogPost } from "@/lib/blog-api";
import { blogPostingSchema, breadcrumbSchema, JsonLd, metadataFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getBlogPost((await params).slug);
  if (!result?.post) return {};
  const post = result.post;
  const metadata = metadataFor(
    post.seoTitle ?? post.title,
    post.seoDescription ?? post.excerpt,
    `/blog/${post.slug}`,
  );
  const image = post.featuredMedia?.variants.featured;
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article" as const,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.displayName],
      images: image
        ? [
            {
              url: `/media/blog/${post.featuredMedia!.id}/featured`,
              width: image.width,
              height: image.height,
              alt: post.featuredMedia!.altText,
            },
          ]
        : [],
    },
    twitter: {
      ...metadata.twitter,
      images: image ? [`/media/blog/${post.featuredMedia!.id}/featured`] : [],
    },
  };
}
export default async function Page({ params }: { readonly params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const result = await getBlogPost(slug);
  if (result?.redirectTo) permanentRedirect(`/blog/${result.redirectTo}`);
  if (!result?.post) notFound();
  const post = result.post;
  return (
    <PublicLayout>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          blogPostingSchema({
            headline: post.title,
            description: post.excerpt,
            path: `/blog/${post.slug}`,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            authorName: post.author.displayName,
            ...(post.author.slug ? { authorPath: `/blog/author/${post.author.slug}` } : {}),
            ...(post.featuredMedia
              ? { imageUrl: `/media/blog/${post.featuredMedia.id}/featured` }
              : {}),
          }),
        ]}
      />
      <BlogArticle post={post} related={result.related ?? []} />
    </PublicLayout>
  );
}
