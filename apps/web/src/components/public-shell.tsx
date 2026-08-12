"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@ctps/ui/layout";
import { Button, IconButton, LinkButton } from "@ctps/ui/primitives";
import { ThemeToggle } from "@ctps/ui/theme";
import { ChevronDown, Menu, Sparkles, X } from "@ctps/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavigation, serviceAreas, services } from "@/content/site";

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

function active(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [managedNavigation, setManagedNavigation] = useState<
    readonly { label: string; href: string }[] | null
  >(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" ? setOpen(false) : trapTab(event, panelRef.current);
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
      trigger?.focus();
    };
  }, [open]);
  useEffect(() => {
    void fetch("/api/marketing/navigation")
      .then((response) => response.json())
      .then((value: { items?: { label: string; href: string }[] }) => {
        if (value.items?.length) setManagedNavigation(value.items);
      })
      .catch(() => undefined);
  }, []);
  const navigation = (managedNavigation ?? primaryNavigation).filter(
    (item) => item.href !== "/services",
  );
  return (
    <>
      <div className="bg-secondary py-2 text-center text-xs font-semibold tracking-wide text-secondary-foreground">
        Residential and commercial service across Vancouver and surrounding communities
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <Container className="flex min-h-18 items-center justify-between gap-4" size="wide">
          <Link
            aria-label="CTPS home"
            className="flex items-center gap-3 font-bold tracking-tight"
            href="/"
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground"
            >
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <span>
              CTPS{" "}
              <span className="hidden font-normal text-muted-foreground sm:inline">
                Clean Precision
              </span>
            </span>
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-0.5 xl:flex">
            <details className="group relative">
              <summary
                className={`flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 text-sm font-semibold hover:bg-surface-muted ${active(pathname, "/services") ? "text-primary" : ""}`}
              >
                Services <ChevronDown aria-hidden="true" className="ml-1 size-4" />
              </summary>
              <div className="absolute left-0 z-20 mt-1 w-64 rounded-md border border-border bg-popover p-2 shadow-[var(--shadow-md)]">
                <Link
                  className="block rounded-sm px-3 py-2 text-sm font-semibold hover:bg-surface-muted"
                  href="/services"
                >
                  All services
                </Link>
                {services.map((service) => (
                  <Link
                    className="block rounded-sm px-3 py-2 text-sm hover:bg-surface-muted"
                    href={`/services/${service.slug}`}
                    key={service.slug}
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            </details>
            {navigation.map((link) => (
              <Link
                aria-current={active(pathname, link.href) ? "page" : undefined}
                className="rounded-md px-2.5 py-2 text-sm font-semibold hover:bg-surface-muted aria-[current=page]:text-primary"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            <LinkButton href="/request-a-quote">Request a Quote</LinkButton>
          </nav>
          <div className="flex items-center gap-2 xl:hidden">
            <ThemeToggle />
            <Button
              aria-expanded={open}
              aria-label="Open navigation menu"
              onClick={() => setOpen(true)}
              ref={triggerRef}
              size="icon"
              variant="outline"
            >
              <Menu aria-hidden="true" />
            </Button>
          </div>
        </Container>
        {open ? (
          <div className="fixed inset-0 z-50 min-h-dvh">
            <button
              aria-label="Close navigation menu"
              className="absolute inset-0 size-full bg-[oklch(0.1_0.02_255/0.65)]"
              onClick={() => setOpen(false)}
            />
            <nav
              aria-label="Mobile navigation"
              aria-modal="true"
              className="absolute inset-y-0 right-0 w-[min(25rem,92vw)] overflow-y-auto bg-popover p-5 text-popover-foreground shadow-[var(--shadow-overlay)]"
              ref={panelRef}
              role="dialog"
            >
              <div className="mb-5 flex items-center justify-between">
                <strong>CTPS navigation</strong>
                <IconButton aria-label="Close navigation menu" onClick={() => setOpen(false)}>
                  <X aria-hidden="true" />
                </IconButton>
              </div>
              <div className="grid gap-1">
                <Link className="mobile-nav-link" href="/services" onClick={() => setOpen(false)}>
                  Services
                </Link>
                <div className="ml-3 border-l border-border pl-3">
                  {services.map((service) => (
                    <Link
                      className="block min-h-10 py-2 text-sm text-muted-foreground"
                      href={`/services/${service.slug}`}
                      key={service.slug}
                      onClick={() => setOpen(false)}
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
                {navigation.map((link) => (
                  <Link
                    aria-current={active(pathname, link.href) ? "page" : undefined}
                    className="mobile-nav-link aria-[current=page]:text-primary"
                    href={link.href}
                    key={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <LinkButton className="mt-3" href="/request-a-quote" onClick={() => setOpen(false)}>
                  Request a Quote
                </LinkButton>
              </div>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}

const footerGroups = [
  {
    title: "Services",
    links: services.map((item) => ({ label: item.name, href: `/services/${item.slug}` })),
  },
  {
    title: "Service areas",
    links: serviceAreas.map((item) => ({ label: item.name, href: `/service-areas/${item.slug}` })),
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Before & After", href: "/before-after" },
      { label: "Blog", href: "/blog" },
      { label: "Estimate", href: "/estimate" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
] as const;

export function PublicFooter() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    void fetch("/api/marketing/site-settings")
      .then((response) => response.json())
      .then((value: Record<string, string>) => setSettings(value))
      .catch(() => undefined);
  }, []);
  return (
    <footer className="border-t border-sidebar-border bg-sidebar py-14 text-sidebar-foreground">
      <Container size="wide">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <p className="text-2xl font-bold">CTPS</p>
            <p className="mt-3 max-w-xs text-sm text-sidebar-muted">
              {settings.footerDescription ??
                "Residential and commercial property-care inquiries across six British Columbia communities."}
            </p>
            <p className="mt-4 max-w-xs text-sm text-sidebar-muted">
              {settings.contactEmail || settings.contactPhone
                ? [settings.contactEmail, settings.contactPhone].filter(Boolean).join(" · ")
                : "Contact details will be added before production."}
            </p>
          </div>
          {footerGroups.map((group) => (
            <nav aria-label={`${group.title} links`} key={group.title}>
              <h2 className="text-sm font-bold uppercase tracking-wider">{group.title}</h2>
              <ul className="mt-3 grid list-none gap-2 p-0">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="text-sm text-sidebar-muted hover:text-sidebar-foreground"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-sidebar-border pt-6 text-sm text-sidebar-muted">
          <span>© {new Date().getFullYear()} CTPS. Policy foundations require review.</span>
          <Link href="/design-system">Design system preview</Link>
        </div>
      </Container>
    </footer>
  );
}

export function PublicLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <PublicHeader />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </>
  );
}
