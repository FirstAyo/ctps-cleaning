import { AboutPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "About",
  "Learn the confirmed CTPS business purpose, service categories, coverage, and quote-based approach.",
  "/about",
);
export default function Page() {
  return <AboutPage />;
}
