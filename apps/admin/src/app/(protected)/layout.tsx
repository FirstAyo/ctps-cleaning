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
  if (identity.permissions.includes("pages.read"))
    navigation.splice(1, 0, { href: "/pages", label: "Marketing Pages" });
  if (identity.permissions.includes("mediaLibrary.read"))
    navigation.splice(2, 0, { href: "/media-library", label: "Public Media" });
  if (identity.permissions.includes("navigation.read"))
    navigation.splice(3, 0, { href: "/navigation", label: "Navigation" });
  if (identity.permissions.includes("siteSettings.read"))
    navigation.splice(4, 0, { href: "/site-settings", label: "Site Settings" });
  if (identity.permissions.includes("seo.view"))
    navigation.splice(5, 0, { href: "/seo", label: "SEO Health" });
  if (
    identity.permissions.includes("jobs.read") ||
    identity.permissions.includes("jobs.readAssigned")
  )
    navigation.splice(2, 0, { href: "/jobs", label: "Jobs" });
  if (identity.permissions.includes("jobs.viewCalendar"))
    navigation.splice(3, 0, { href: "/jobs/calendar", label: "Job Calendar" });
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
  if (identity.permissions.includes("pricingVersions.read"))
    navigation.splice(2, 0, { href: "/pricing/versions", label: "Pricing" });
  if (identity.permissions.includes("estimatorResults.read"))
    navigation.splice(3, 0, { href: "/estimator-results", label: "Estimator Results" });
  if (
    identity.permissions.includes("blogPosts.readOwn") ||
    identity.permissions.includes("blogPosts.readAll")
  )
    navigation.splice(2, 0, { href: "/blog/posts", label: "Blog Posts" });
  if (identity.permissions.includes("blogCategories.manage"))
    navigation.splice(3, 0, { href: "/blog/categories", label: "Blog Categories" });
  if (identity.permissions.includes("blogTags.manage"))
    navigation.splice(4, 0, { href: "/blog/tags", label: "Blog Tags" });
  if (identity.permissions.includes("authorProfiles.read"))
    navigation.splice(5, 0, { href: "/blog/authors", label: "Blog Authors" });
  return (
    <AdminShell
      description="Protected staff administration. The API rechecks every permission."
      identity={identity}
      navigationItems={navigation}
      pageTitle="Administration"
    >
      {children}
    </AdminShell>
  );
}
