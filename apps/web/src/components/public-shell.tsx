"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@ctps/ui/layout";
import { Button, IconButton, LinkButton } from "@ctps/ui/primitives";
import { ThemeToggle } from "@ctps/ui/theme";
import Link from "next/link";

const links = [
  "Services",
  "Before & After",
  "Service Areas",
  "Estimate",
  "Blog",
  "About",
  "Contact",
] as const;

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

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      else trapTab(event, panelRef.current);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
      trigger?.focus();
    };
  }, [open]);
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <Container className="flex min-h-18 items-center justify-between gap-4" size="wide">
        <Link
          aria-label="CTPS design foundation"
          className="flex items-center gap-3 font-bold tracking-tight"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground"
          >
            C
          </span>
          <span>
            CTPS <span className="font-normal text-muted-foreground">Clean Precision</span>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <a
              className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-surface-muted"
              href="/design-system"
              key={link}
            >
              {link}
            </a>
          ))}
          <ThemeToggle />
          <LinkButton href="/design-system">Request a Quote</LinkButton>
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
            <span aria-hidden="true">Menu</span>
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
            className="absolute inset-y-0 right-0 w-[min(24rem,92vw)] overflow-y-auto bg-popover p-5 text-popover-foreground shadow-[var(--shadow-overlay)]"
            ref={panelRef}
            role="dialog"
          >
            <div className="mb-6 flex items-center justify-between">
              <strong>CTPS navigation</strong>
              <IconButton aria-label="Close navigation menu" onClick={() => setOpen(false)}>
                ×
              </IconButton>
            </div>
            <div className="grid gap-1">
              {links.map((link) => (
                <a
                  className="flex min-h-12 items-center rounded-md px-3 font-semibold hover:bg-surface-muted"
                  href="/design-system"
                  key={link}
                  onClick={() => setOpen(false)}
                >
                  {link}
                </a>
              ))}
              <LinkButton className="mt-3" href="/design-system" onClick={() => setOpen(false)}>
                Request a Quote
              </LinkButton>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  const groups = [
    { title: "Services", links: ["Window Cleaning", "Pressure Washing", "Gutter Cleaning"] },
    { title: "Company", links: ["About", "Contact", "Service Areas"] },
    { title: "Resources", links: ["Design System", "Blog", "Before & After"] },
    { title: "Legal", links: ["Privacy placeholder", "Terms placeholder"] },
  ];
  return (
    <footer className="border-t border-sidebar-border bg-sidebar py-12 text-sidebar-foreground">
      <Container size="wide">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <p className="text-xl font-bold">CTPS</p>
            <p className="mt-2 max-w-xs text-sm text-sidebar-muted">
              Clean Precision design foundation. Verified business contact information will be added
              in a later phase.
            </p>
          </div>
          {groups.map((group) => (
            <nav aria-label={`${group.title} links`} key={group.title}>
              <h2 className="text-sm font-bold uppercase tracking-wider">{group.title}</h2>
              <ul className="mt-3 grid list-none gap-2 p-0">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      className="text-sm text-sidebar-muted hover:text-sidebar-foreground"
                      href="/design-system"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-sidebar-border pt-6 text-sm text-sidebar-muted">
          Phase 2 demonstration — not final production navigation or content.
        </div>
      </Container>
    </footer>
  );
}
