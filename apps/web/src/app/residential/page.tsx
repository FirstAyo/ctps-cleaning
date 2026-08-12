import { AudiencePage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "Residential Services",
  "Explore residential CTPS property-care services and the quote-based workflow.",
  "/residential",
);
export function generateMetadata() {
  return getMarketingMetadata("RESIDENTIAL", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<AudiencePage />} pageKey="RESIDENTIAL" />;
}
