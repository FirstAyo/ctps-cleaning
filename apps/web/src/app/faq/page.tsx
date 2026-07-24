import { FaqPage } from "@/components/public-pages";
import { generalFaqs } from "@/content/site";
import { faqSchema, JsonLd, metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "FAQ",
  "Read answers about CTPS services, areas, quote review, estimator, and planned photo workflow.",
  "/faq",
);
export default function Page() {
  return (
    <>
      <JsonLd data={faqSchema(generalFaqs)} />
      <FaqPage />
    </>
  );
}
