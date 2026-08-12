import { notFound, redirect } from "next/navigation";

import { MarketingPageEditor } from "@/components/marketing-page-editor";
import { AdminApiError, adminApi, currentIdentity } from "@/lib/admin-api";
import type { MarketingPage, MarketingProjectOption, PublicMediaItem } from "@/lib/marketing-types";

export default async function PageEditor({
  params,
}: {
  readonly params: Promise<{ pageKey: string }>;
}) {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  const { pageKey } = await params;
  const [page, media, projects] = await Promise.all([
    adminApi<MarketingPage>(`admin/pages/${encodeURIComponent(pageKey)}`),
    identity.permissions.includes("mediaLibrary.read")
      ? adminApi<{ items: PublicMediaItem[] }>("admin/media-library")
      : Promise.resolve({ items: [] }),
    identity.permissions.includes("projects.beforeAfter.read")
      ? adminApi<{ items: MarketingProjectOption[] }>(
          "admin/before-after-projects?status=PUBLISHED&pageSize=24",
        )
      : Promise.resolve({ items: [] }),
  ]).catch((error: unknown) => {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    throw error;
  });
  return (
    <MarketingPageEditor
      canPublish={identity.permissions.includes("pages.publish")}
      canSeo={identity.permissions.includes("pages.manageSeo")}
      canMediaUpload={identity.permissions.includes("mediaLibrary.upload")}
      canMediaUpdate={identity.permissions.includes("mediaLibrary.update")}
      media={media.items}
      page={page}
      projects={projects.items}
    />
  );
}
