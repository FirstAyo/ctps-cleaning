import { redirect } from "next/navigation";
import { SiteSettingsManager, type SiteSettings } from "@/components/site-settings-manager";
import { adminApi, currentIdentity } from "@/lib/admin-api";
import type { PublicMediaItem } from "@/lib/marketing-types";
export default async function SiteSettingsPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  if (!identity.permissions.includes("siteSettings.read"))
    return <p>You do not have access to site settings.</p>;
  const settings = await adminApi<SiteSettings>("admin/site-settings");
  const canReadMedia = identity.permissions.includes("mediaLibrary.read");
  const mediaIds = [settings.logoMediaId, settings.defaultSocialImageId].filter(
    (id): id is string => Boolean(id),
  );
  const initialMedia = canReadMedia
    ? await Promise.all(
        [...new Set(mediaIds)].map((id) =>
          adminApi<PublicMediaItem>(`admin/media-library/${id}`).catch(() => null),
        ),
      ).then((items) => items.filter((item): item is PublicMediaItem => item !== null))
    : [];
  return (
    <SiteSettingsManager
      canReadMedia={canReadMedia}
      canUpdateMedia={identity.permissions.includes("mediaLibrary.update")}
      canUploadMedia={identity.permissions.includes("mediaLibrary.upload")}
      editable={identity.permissions.includes("siteSettings.update")}
      initialMedia={initialMedia}
      initialSettings={settings}
    />
  );
}
