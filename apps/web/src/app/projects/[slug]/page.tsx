import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/portfolio";
import { PublicLayout } from "@/components/public-shell";
import { getPublishedProject, getPublishedProjectContext } from "@/lib/before-after-api";
import { breadcrumbSchema, JsonLd, metadataFor } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return {};
  const metadata = metadataFor(
    project.seoTitle ?? project.title,
    project.seoDescription ?? project.summary,
    `/projects/${project.slug}`,
  );
  const media = project.coverMedia ?? project.primaryAfterMedia;
  const image = media.variants.large ?? media.variants.original;
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: image
        ? [{ url: image.path, width: image.width, height: image.height, alt: media.altText }]
        : [],
    },
    twitter: { ...metadata.twitter, images: image ? [image.path] : [] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const context = await getPublishedProjectContext(slug);
  if (!context) notFound();
  return (
    <PublicLayout>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: context.project.title, path: `/projects/${context.project.slug}` },
        ])}
      />
      <ProjectDetail context={context} />
    </PublicLayout>
  );
}
