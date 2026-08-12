import { notFound } from "next/navigation";
import { ServicePageContent } from "@/components/marketing";
import { PublicLayout } from "@/components/public-shell";
import { getService, services } from "@/content/site";
import { breadcrumbSchema, JsonLd, metadataFor } from "@/lib/seo";
import { getMarketingMetadata, getMarketingPage } from "@/lib/marketing-api";
import { MarketingPageRenderer } from "@/components/marketing-page-renderer";
export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: { readonly params: Promise<{ slug: string }> }) {
  const service = getService((await params).slug);
  if (!service) return {};
  return getMarketingMetadata(
    `SERVICE_${service.slug.replaceAll("-", "_").toUpperCase()}`,
    metadataFor(service.name, service.summary, `/services/${service.slug}`),
  );
}
export default async function Page({ params }: { readonly params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const service = getService(slug);
  if (!service) notFound();
  const marketingPage = await getMarketingPage(
    `SERVICE_${slug.replaceAll("-", "_").toUpperCase()}`,
  );
  return (
    <PublicLayout>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.name,
            description: service.summary,
            areaServed: [
              "Vancouver",
              "Richmond",
              "Burnaby",
              "Surrey",
              "Coquitlam",
              "North Vancouver",
            ],
          },
        ]}
      />
      {marketingPage ? (
        <MarketingPageRenderer page={marketingPage} />
      ) : (
        <ServicePageContent service={service} />
      )}
    </PublicLayout>
  );
}
