import { EstimatePage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Estimator Foundation",
  "Learn how the future CTPS preliminary non-binding estimator is planned to work.",
  "/estimate",
);
export default function Page() {
  return <EstimatePage />;
}
