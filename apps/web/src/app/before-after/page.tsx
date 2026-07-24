import { BeforeAfterPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Before & After",
  "Explore the accessible CTPS portfolio foundation using clearly labeled local demonstration imagery.",
  "/before-after",
);
export default function Page() {
  return <BeforeAfterPage />;
}
