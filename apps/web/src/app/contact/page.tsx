import { ContactPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "Contact",
  "Use Contact for general inquiries or Request a Quote for property-specific service requests.",
  "/contact",
);
export function generateMetadata() {
  return getMarketingMetadata("CONTACT", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<ContactPage />} pageKey="CONTACT" />;
}
