import { AudiencePage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Residential Services",
  "Explore residential CTPS property-care services and the quote-based workflow.",
  "/residential",
);
export default function Page() {
  return <AudiencePage />;
}
