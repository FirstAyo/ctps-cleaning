import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/portfolio";
import { PublicLayout } from "@/components/public-shell";
import { getPublishedProject } from "@/lib/before-after-api";
import { breadcrumbSchema, JsonLd, metadataFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return {};
  const metadata = metadataFor(
    project.seoTitle ?? project.title,
    project.seoDescription ?? project.summary,
    `/before-after/${project.slug}`,
  );
  const image =
    project.primaryAfterMedia.variants.large ?? project.primaryAfterMedia.variants.original;
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: image
        ? [
            {
              url: image.path,
              width: image.width,
              height: image.height,
              alt: project.primaryAfterMedia.altText,
            },
          ]
        : [],
    },
    twitter: { ...metadata.twitter, images: image ? [image.path] : [] },
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();
  return (
    <PublicLayout>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Before & After", path: "/before-after" },
          { name: project.title, path: `/before-after/${project.slug}` },
        ])}
      />
      <ProjectDetail project={project} />
    </PublicLayout>
  );
}
