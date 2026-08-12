import { ContactPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "Contact",
  "View the CTPS contact-page foundation and confirmed service-area summary.",
  "/contact",
);
export function generateMetadata() {
  return getMarketingMetadata("CONTACT", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<ContactPage />} pageKey="CONTACT" />;
}
