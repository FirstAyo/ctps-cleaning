import { redirect } from "next/navigation";
import { NavigationManager } from "@/components/navigation-manager";
import { adminApi, currentIdentity } from "@/lib/admin-api";
export default async function NavigationPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  if (!identity.permissions.includes("navigation.read"))
    return <p>You do not have access to navigation settings.</p>;
  const { items } = await adminApi<{
    items: Array<{
      systemKey: string;
      label: string;
      href: string;
      enabled: boolean;
      sortOrder: number;
      version: number;
    }>;
  }>("admin/navigation");
  return (
    <NavigationManager
      editable={identity.permissions.includes("navigation.update")}
      initialItems={items}
    />
  );
}
