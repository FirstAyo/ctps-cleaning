import { BlogPage } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  "Planned Blog",
  "Explore clearly labeled CTPS editorial topic placeholders ahead of the Phase 8 publishing system.",
  "/blog",
);
export default function Page() {
  return <BlogPage />;
}
