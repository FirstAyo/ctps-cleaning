import { getMarketingPage } from "@/lib/marketing-api";
import { MarketingPageRenderer } from "./marketing-page-renderer";
import { PublicLayout } from "./public-shell";

export async function CmsManagedPage({
  pageKey,
  fallback,
}: {
  readonly pageKey: string;
  readonly fallback: React.ReactNode;
}) {
  const page = await getMarketingPage(pageKey);
  if (!page) return fallback;
  return (
    <PublicLayout>
      <MarketingPageRenderer page={page} />
    </PublicLayout>
  );
}
