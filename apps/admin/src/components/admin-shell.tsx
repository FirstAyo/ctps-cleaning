"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@ctps/ui/content";
import { Breadcrumb } from "@ctps/ui/navigation";
import { Button, IconButton } from "@ctps/ui/primitives";
import { ThemeToggle } from "@ctps/ui/theme";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "@ctps/ui/icons";
import { cn } from "@ctps/ui/utils";
import Link from "next/link";

const demoNavigation = [
  "Dashboard",
  "Quote Requests",
  "Estimates",
  "Services",
  "Service Areas",
  "Before & After",
  "Blog",
  "Media",
  "Pricing",
  "Users",
  "Roles & Permissions",
  "Audit Logs",
  "Settings",
] as const;

export interface AdminNavigationItem {
  readonly href: string;
  readonly label: string;
}

function trapTab(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab" || !container) return;
  const focusable = [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function SidebarNavigation({
  collapsed = false,
  items,
  onNavigate,
}: {
  readonly collapsed?: boolean;
  readonly items: readonly AdminNavigationItem[];
  readonly onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Administration navigation" className="grid gap-1 p-3">
      {items.map((item) => {
        const Icon =
          item.href === "/dashboard"
            ? LayoutDashboard
            : item.href.startsWith("/pages")
              ? FileText
              : item.href.startsWith("/media-library")
                ? ImageIcon
                : item.href.startsWith("/navigation")
                  ? Navigation
                  : item.href.startsWith("/site-settings")
                    ? Settings
                    : item.href.startsWith("/jobs/calendar")
                      ? CalendarDays
                      : item.href.startsWith("/jobs")
                        ? BriefcaseBusiness
                        : item.href.startsWith("/blog")
                          ? BookOpen
                          : item.href.startsWith("/pricing") || item.href.startsWith("/estimator")
                            ? CircleDollarSign
                            : item.href.startsWith("/quote") ||
                                item.href.startsWith("/before-after")
                              ? ClipboardList
                              : item.href.startsWith("/users") || item.href.startsWith("/account")
                                ? Users
                                : item.href.startsWith("/roles") || item.href.startsWith("/audit")
                                  ? ShieldCheck
                                  : Gauge;
        return (
          <Link
            {...(collapsed ? { "aria-label": item.label } : {})}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
              item.href === "/dashboard" && "bg-sidebar-accent text-sidebar-foreground",
            )}
            href={item.href}
            key={`${item.href}:${item.label}`}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
            {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  description = "Unprotected Phase 2 component demonstration. No staff session or permissions exist.",
  identity,
  navigationItems = demoNavigation.map((label) => ({ href: "/design-system", label })),
  pageTitle,
}: {
  readonly children: React.ReactNode;
  readonly description?: string;
  readonly identity?: { readonly displayName: string; readonly email: string };
  readonly navigationItems?: readonly AdminNavigationItem[];
  readonly pageTitle: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const mobilePanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = mobileTrigger.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobilePanel.current?.querySelector<HTMLElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      else trapTab(event, mobilePanel.current);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
      trigger?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-background">
      <a className="skip-link" href="#admin-content">
        Skip to main content
      </a>
      <div
        className={cn(
          "hidden min-h-dvh bg-sidebar text-sidebar-foreground md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:transition-[width]",
          collapsed ? "md:w-20" : "md:w-64",
        )}
      >
        <div className="flex min-h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <Link aria-label="CTPS admin design foundation" className="font-bold" href="/">
            {collapsed ? "C" : "CTPS Admin"}
          </Link>
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </IconButton>
        </div>
        <div className="overflow-y-auto">
          <SidebarNavigation collapsed={collapsed} items={navigationItems} />
        </div>
        <p
          className={cn(
            "mt-auto border-t border-sidebar-border p-4 text-xs text-sidebar-muted",
            collapsed && "sr-only",
          )}
        >
          {identity ? "Authorized staff access" : "Unprotected design demonstration"}
        </p>
      </div>
      <div className={cn("transition-[padding]", collapsed ? "md:pl-20" : "md:pl-64")}>
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              aria-expanded={mobileOpen}
              aria-label="Open admin navigation"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              ref={mobileTrigger}
              size="icon"
              variant="outline"
            >
              <Menu aria-hidden="true" />
            </Button>
            <div>
              <p className="text-sm font-semibold">
                {identity ? identity.displayName : "Design-system demonstration"}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {identity?.email ?? "Authentication is not implemented"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button aria-label="Open user menu placeholder" className="rounded-full">
              <Avatar label={identity?.displayName ?? "Demo user placeholder"} />
            </button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8" id="admin-content">
          <div className="mx-auto max-w-[var(--container-admin)]">
            <Breadcrumb items={["Admin preview", pageTitle]} />
            <div className="mt-3 mb-6">
              <h1 className="admin-page-heading">{pageTitle}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close admin navigation"
            className="absolute inset-0 size-full bg-[oklch(0.1_0.02_255/0.65)]"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            aria-label="Mobile admin navigation"
            aria-modal="true"
            className="absolute inset-y-0 left-0 w-[min(20rem,90vw)] overflow-y-auto bg-sidebar text-sidebar-foreground shadow-[var(--shadow-overlay)]"
            ref={mobilePanel}
            role="dialog"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-sidebar-border px-4">
              <strong>CTPS Admin demo</strong>
              <IconButton
                aria-label="Close admin navigation"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setMobileOpen(false)}
              >
                <X aria-hidden="true" />
              </IconButton>
            </div>
            <SidebarNavigation items={navigationItems} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
