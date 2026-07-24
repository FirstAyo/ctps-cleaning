import { notFound } from "next/navigation";
import { AreaPageContent } from "@/components/marketing";
import { PublicLayout } from "@/components/public-shell";
import { getServiceArea, serviceAreas } from "@/content/site";
import { breadcrumbSchema, JsonLd, metadataFor } from "@/lib/seo";
export function generateStaticParams() {
  return serviceAreas.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: { readonly params: Promise<{ slug: string }> }) {
  const area = getServiceArea((await params).slug);
  return area
    ? metadataFor(`${area.name} Services`, area.summary, `/service-areas/${area.slug}`)
    : {};
}
export default async function Page({ params }: { readonly params: Promise<{ slug: string }> }) {
  const area = getServiceArea((await params).slug);
  if (!area) notFound();
  return (
    <PublicLayout>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Service Areas", path: "/service-areas" },
          { name: area.name, path: `/service-areas/${area.slug}` },
        ])}
      />
      <AreaPageContent area={area} />
    </PublicLayout>
  );
}
