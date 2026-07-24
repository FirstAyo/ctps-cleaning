import { ContactPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Contact",
  "View the CTPS contact-page foundation and confirmed service-area summary.",
  "/contact",
);
export default function Page() {
  return <ContactPage />;
}
