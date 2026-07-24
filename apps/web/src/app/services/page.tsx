import { ServicesOverviewPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Services",
  "Explore CTPS residential and commercial property-care service categories.",
  "/services",
);
export default function Page() {
  return <ServicesOverviewPage />;
}
