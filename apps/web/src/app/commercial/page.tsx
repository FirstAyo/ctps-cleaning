import { AudiencePage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "Commercial Services",
  "Explore commercial CTPS property-care service categories and quote review.",
  "/commercial",
);
export function generateMetadata() {
  return getMarketingMetadata("COMMERCIAL", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<AudiencePage commercial />} pageKey="COMMERCIAL" />;
}
