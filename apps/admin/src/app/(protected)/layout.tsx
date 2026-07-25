import { redirect } from "next/navigation";
import { AdminShell, type AdminNavigationItem } from "@/components/admin-shell";
import { currentIdentity } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  if (identity.mustChangePassword) redirect("/change-password");
  const navigation: AdminNavigationItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/account", label: "Account & sessions" },
  ];
  if (identity.permissions.includes("users.read"))
    navigation.push({ href: "/users", label: "Users" });
  if (identity.permissions.includes("roles.read"))
    navigation.push({ href: "/roles", label: "Roles & permissions" });
  if (identity.permissions.includes("audit.read"))
    navigation.push({ href: "/audit-logs", label: "Audit logs" });
  if (identity.permissions.includes("projects.beforeAfter.read"))
    navigation.splice(2, 0, { href: "/before-after", label: "Before & After" });
  if (identity.permissions.includes("quoteRequests.read"))
    navigation.splice(2, 0, { href: "/quote-requests", label: "Quote Requests" });
  return (
    <AdminShell
      description="Protected Phase 3 staff administration. The API rechecks every permission."
      identity={identity}
      navigationItems={navigation}
      pageTitle="Administration"
    >
      {children}
    </AdminShell>
  );
}
