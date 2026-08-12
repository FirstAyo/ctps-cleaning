import { ServiceAreasOverviewPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "Service Areas",
  "Explore CTPS property-care service presentation across six Metro Vancouver communities.",
  "/service-areas",
);
export function generateMetadata() {
  return getMarketingMetadata("SERVICE_AREAS", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<ServiceAreasOverviewPage />} pageKey="SERVICE_AREAS" />;
}
