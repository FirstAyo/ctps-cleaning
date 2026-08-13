import { notFound } from "next/navigation";
import { AreaPageContent } from "@/components/marketing";
import { PublicLayout } from "@/components/public-shell";
import { getServiceArea, serviceAreas } from "@/content/site";
import { breadcrumbSchema, JsonLd, metadataFor } from "@/lib/seo";
import { getMarketingMetadata, getMarketingPage } from "@/lib/marketing-api";
import { MarketingPageRenderer } from "@/components/marketing-page-renderer";
import { getPublishedProjects } from "@/lib/before-after-api";
import { Breadcrumbs } from "@/components/breadcrumbs";
export function generateStaticParams() {
  return serviceAreas.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: { readonly params: Promise<{ slug: string }> }) {
  const area = getServiceArea((await params).slug);
  if (!area) return {};
  return getMarketingMetadata(
    `AREA_${area.slug.replaceAll("-", "_").toUpperCase()}`,
    metadataFor(`${area.name} Services`, area.summary, `/service-areas/${area.slug}`),
  );
}
export default async function Page({ params }: { readonly params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const area = getServiceArea(slug);
  if (!area) notFound();
  const [marketingPage, projectResult] = await Promise.all([
    getMarketingPage(`AREA_${slug.replaceAll("-", "_").toUpperCase()}`),
    getPublishedProjects({ serviceAreaKey: slug, pageSize: "24" }),
  ]);
  return (
    <PublicLayout>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
          { name: area.name, path: `/service-areas/${area.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
          { name: area.name, path: `/service-areas/${area.slug}` },
        ]}
      />
      {marketingPage ? (
        <MarketingPageRenderer page={marketingPage} projects={projectResult.items} />
      ) : (
        <AreaPageContent area={area} />
      )}
    </PublicLayout>
  );
}
