import { AudiencePage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Commercial Services",
  "Explore commercial CTPS property-care service categories and quote review.",
  "/commercial",
);
export default function Page() {
  return <AudiencePage commercial />;
}
