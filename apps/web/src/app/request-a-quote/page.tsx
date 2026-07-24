import { QuoteRequestPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Request a Quote",
  "Preview the planned CTPS quote-request workflow. Submission is not active in Phase 4.",
  "/request-a-quote",
);
export default function Page() {
  return <QuoteRequestPage />;
}
