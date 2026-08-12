import { getMarketingPage } from "@/lib/marketing-api";
import { getSiteSettings } from "@/lib/marketing-api";
import { getPublishedProjects } from "@/lib/before-after-api";
import { MarketingPageRenderer } from "./marketing-page-renderer";
import { PublicLayout } from "./public-shell";

export async function CmsManagedPage({
  pageKey,
  fallback,
}: {
  readonly pageKey: string;
  readonly fallback: React.ReactNode;
}) {
  const [page, projectResult, settings] = await Promise.all([
    getMarketingPage(pageKey),
    getPublishedProjects({ pageSize: "24" }),
    pageKey === "CONTACT" ? getSiteSettings() : Promise.resolve(null),
  ]);
  if (!page) return fallback;
  return (
    <PublicLayout>
      <MarketingPageRenderer page={page} projects={projectResult.items} settings={settings} />
    </PublicLayout>
  );
}
