import { ServicesOverviewPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "Services",
  "Explore CTPS residential and commercial property-care service categories.",
  "/services",
);
export function generateMetadata() {
  return getMarketingMetadata("SERVICES", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<ServicesOverviewPage />} pageKey="SERVICES" />;
}
