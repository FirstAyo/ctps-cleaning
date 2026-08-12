import { AboutPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
import { CmsManagedPage } from "@/components/cms-managed-page";
import { getMarketingMetadata } from "@/lib/marketing-api";
const fallbackMetadata = metadataFor(
  "About",
  "Learn the confirmed CTPS business purpose, service categories, coverage, and quote-based approach.",
  "/about",
);
export function generateMetadata() {
  return getMarketingMetadata("ABOUT", fallbackMetadata);
}
export default function Page() {
  return <CmsManagedPage fallback={<AboutPage />} pageKey="ABOUT" />;
}
