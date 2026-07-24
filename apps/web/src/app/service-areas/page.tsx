import { ServiceAreasOverviewPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Service Areas",
  "Explore CTPS property-care service presentation across six Metro Vancouver communities.",
  "/service-areas",
);
export default function Page() {
  return <ServiceAreasOverviewPage />;
}
