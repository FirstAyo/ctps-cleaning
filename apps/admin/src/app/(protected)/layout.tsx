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
  const permits = (permission: string) => identity.permissions.includes(permission);
  const navigation: AdminNavigationItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    ...(permits("pages.read") ? [{ href: "/pages", label: "Marketing Pages" }] : []),
    ...(permits("mediaLibrary.read") ? [{ href: "/media-library", label: "Public Media" }] : []),
    ...(permits("navigation.read") ? [{ href: "/navigation", label: "Navigation" }] : []),
    ...(permits("siteSettings.read") ? [{ href: "/site-settings", label: "Site Settings" }] : []),
    ...(permits("seo.view") ? [{ href: "/seo", label: "SEO Health" }] : []),
    ...(permits("projects.beforeAfter.read") ? [{ href: "/before-after", label: "Projects" }] : []),
    ...(permits("quoteRequests.read")
      ? [{ href: "/quote-requests", label: "Quote Requests" }]
      : []),
    ...(permits("generalInquiries.read")
      ? [{ href: "/general-inquiries", label: "Messages" }]
      : []),
    ...(permits("pricingVersions.read") ? [{ href: "/pricing/versions", label: "Pricing" }] : []),
    ...(permits("estimatorResults.read")
      ? [{ href: "/estimator-results", label: "Estimator Results" }]
      : []),
    ...(permits("blogPosts.readOwn") || permits("blogPosts.readAll")
      ? [{ href: "/blog/posts", label: "Blog Posts" }]
      : []),
    ...(permits("blogCategories.manage")
      ? [{ href: "/blog/categories", label: "Blog Categories" }]
      : []),
    ...(permits("blogTags.manage") ? [{ href: "/blog/tags", label: "Blog Tags" }] : []),
    ...(permits("authorProfiles.read") ? [{ href: "/blog/authors", label: "Blog Authors" }] : []),
    ...(permits("jobs.read") || permits("jobs.readAssigned")
      ? [{ href: "/jobs", label: "Jobs" }]
      : []),
    ...(permits("jobs.viewCalendar") ? [{ href: "/jobs/calendar", label: "Job Calendar" }] : []),
    { href: "/account", label: "Account & sessions" },
    ...(permits("users.read") ? [{ href: "/users", label: "Users" }] : []),
    ...(permits("roles.read") ? [{ href: "/roles", label: "Roles & permissions" }] : []),
    ...(permits("audit.read") ? [{ href: "/audit-logs", label: "Audit logs" }] : []),
  ];
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
