import { redirect } from "next/navigation";
import { SiteSettingsManager } from "@/components/site-settings-manager";
import { adminApi, currentIdentity } from "@/lib/admin-api";
export default async function SiteSettingsPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  if (!identity.permissions.includes("siteSettings.read"))
    return <p>You do not have access to site settings.</p>;
  const settings = await adminApi<Record<string, string>>("admin/site-settings");
  return (
    <SiteSettingsManager
      editable={identity.permissions.includes("siteSettings.update")}
      initialSettings={settings}
    />
  );
}
