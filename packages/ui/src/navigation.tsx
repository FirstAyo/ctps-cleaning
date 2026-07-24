"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button, IconButton } from "./primitives";

function trapTab(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab" || !container) return;
  const focusable = [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

export function Dialog({
  description,
  title,
  triggerLabel,
  children,
}: {
  readonly description?: string;
  readonly title: string;
  readonly triggerLabel: string;
  readonly children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = () => {
    dialogRef.current?.close();
    triggerRef.current?.focus();
  };

  return (
    <>
      <Button onClick={() => dialogRef.current?.showModal()} ref={triggerRef}>
        {triggerLabel}
      </Button>
      <dialog
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100%-2rem))] rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-[var(--shadow-overlay)] backdrop:bg-[oklch(0.1_0.02_255/0.65)]"
        onCancel={close}
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-xl font-semibold" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <IconButton aria-label="Close dialog" onClick={close}>
            ×
          </IconButton>
        </div>
        <div className="p-5">{children}</div>
      </dialog>
    </>
  );
}

export function AlertDialog({
  title = "Confirm demonstration action",
}: {
  readonly title?: string;
}) {
  return (
    <Dialog
      description="This control demonstrates an explicit confirmation pattern. It does not change data."
      title={title}
      triggerLabel="Open confirmation"
    >
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Confirm demo</Button>
      </div>
    </Dialog>
  );
}

export function Drawer({
  children,
  title,
  triggerLabel = "Open drawer",
}: {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      else trapTab(event, panelRef.current);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleKey);
      triggerRef.current?.focus();
    };
  }, [open]);
  return (
    <>
      <Button aria-expanded={open} onClick={() => setOpen(true)} ref={triggerRef}>
        {triggerLabel}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            aria-label="Close drawer"
            className="absolute inset-0 size-full bg-[oklch(0.1_0.02_255/0.65)]"
            onClick={() => setOpen(false)}
          />
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-[min(26rem,90vw)] overflow-y-auto border-l border-border bg-popover p-5 text-popover-foreground shadow-[var(--shadow-overlay)] motion-reveal"
            ref={panelRef}
            role="dialog"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold" id={titleId}>
                {title}
              </h2>
              <IconButton aria-label="Close drawer" onClick={() => setOpen(false)}>
                ×
              </IconButton>
            </div>
            {children}
          </section>
        </div>
      ) : null}
    </>
  );
}

export function DropdownMenu({
  items,
  label,
}: {
  readonly items: readonly string[];
  readonly label: string;
}) {
  return (
    <details className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 font-semibold hover:bg-surface-muted">
        {label}
        <span aria-hidden="true" className="ml-2">
          ⌄
        </span>
      </summary>
      <div
        className="absolute right-0 z-20 mt-2 min-w-48 rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-md)]"
        role="menu"
      >
        {items.map((item) => (
          <button
            className="block min-h-10 w-full rounded-sm px-3 text-left text-sm hover:bg-surface-muted"
            key={item}
            role="menuitem"
          >
            {item}
          </button>
        ))}
      </div>
    </details>
  );
}

export function Tooltip({
  children,
  label,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground group-focus-within:block group-hover:block"
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
export function Popover({
  children,
  label,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
}) {
  return (
    <details className="relative inline-block">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md border border-border px-3 font-semibold">
        {label}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-border bg-popover p-4 shadow-[var(--shadow-md)]">
        {children}
      </div>
    </details>
  );
}

export function Tabs({
  tabs,
}: {
  readonly tabs: readonly { readonly label: string; readonly content: React.ReactNode }[];
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    )
      return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setSelected(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };
  return (
    <div>
      <div
        aria-label="Design system examples"
        className="flex gap-1 overflow-x-auto border-b border-border"
        role="tablist"
      >
        {tabs.map((tab, index) => (
          <button
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selected === index}
            className="min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-semibold aria-selected:border-primary aria-selected:text-primary"
            id={`${id}-tab-${index}`}
            key={tab.label}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            role="tab"
            tabIndex={selected === index ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          aria-labelledby={`${id}-tab-${index}`}
          className="py-5"
          hidden={selected !== index}
          id={`${id}-panel-${index}`}
          key={tab.label}
          role="tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

export function Accordion({
  items,
}: {
  readonly items: readonly { readonly title: string; readonly content: React.ReactNode }[];
}) {
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {items.map((item) => (
        <details className="group p-4" key={item.title}>
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-semibold">
            {item.title}
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="pt-3 text-sm text-muted-foreground">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

export function Breadcrumb({ items }: { readonly items: readonly string[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li className="flex items-center gap-2" key={item}>
            {index ? <span aria-hidden="true">/</span> : null}
            <span aria-current={index === items.length - 1 ? "page" : undefined}>{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function Pagination() {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      <Button aria-label="Previous page" variant="outline">
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page 1 of 3</span>
      <Button aria-label="Next page" variant="outline">
        Next
      </Button>
    </nav>
  );
}

export function ToastDemo() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [visible]);
  return (
    <div>
      <Button onClick={() => setVisible(true)} variant="outline">
        Show success toast
      </Button>
      {visible ? (
        <div
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-success/40 bg-popover p-4 shadow-[var(--shadow-overlay)]"
          role="status"
        >
          <div className="flex gap-4">
            <div>
              <p className="font-semibold">Demonstration saved</p>
              <p className="text-sm text-muted-foreground">No application data was changed.</p>
            </div>
            <IconButton aria-label="Dismiss notification" onClick={() => setVisible(false)}>
              ×
            </IconButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
