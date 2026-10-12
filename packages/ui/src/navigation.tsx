"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

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

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly description: React.ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
  readonly busy?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-[var(--shadow-overlay)] backdrop:bg-[oklch(0.1_0.02_255/0.7)]"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      ref={dialogRef}
    >
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-semibold" id={titleId}>
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-muted-foreground" id={descriptionId}>
          {description}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
        <Button disabled={busy} onClick={onCancel} type="button" variant="outline">
          {cancelLabel}
        </Button>
        <Button
          autoFocus
          disabled={busy}
          onClick={onConfirm}
          type="button"
          variant={destructive ? "destructive" : "primary"}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

export interface ConfirmationRequest {
  readonly title: string;
  readonly description: React.ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
}

const ConfirmationContext = createContext<
  ((request: ConfirmationRequest) => Promise<boolean>) | null
>(null);

export function ConfirmationProvider({ children }: { readonly children: React.ReactNode }) {
  const [pending, setPending] = useState<
    | (ConfirmationRequest & {
        readonly resolve: (confirmed: boolean) => void;
      })
    | null
  >(null);
  const confirm = useCallback(
    (request: ConfirmationRequest) =>
      new Promise<boolean>((resolve) => setPending({ ...request, resolve })),
    [],
  );
  const value = useMemo(() => confirm, [confirm]);
  const finish = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };
  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationDialog
        description={pending?.description ?? "Confirm this action."}
        onCancel={() => finish(false)}
        onConfirm={() => finish(true)}
        open={Boolean(pending)}
        title={pending?.title ?? "Confirm action"}
        {...(pending?.cancelLabel ? { cancelLabel: pending.cancelLabel } : {})}
        {...(pending?.confirmLabel ? { confirmLabel: pending.confirmLabel } : {})}
        {...(pending?.destructive !== undefined ? { destructive: pending.destructive } : {})}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error("useConfirmation must be used within ConfirmationProvider");
  return context;
}

export interface TextEntryRequest {
  readonly title: string;
  readonly description?: string;
  readonly label: string;
  readonly initialValue?: string;
  readonly confirmLabel?: string;
  readonly multiline?: boolean;
  readonly required?: boolean;
}

const TextEntryContext = createContext<
  ((request: TextEntryRequest) => Promise<string | null>) | null
>(null);

function TextEntryDialog({
  request,
  onCancel,
  onConfirm,
}: {
  readonly request: TextEntryRequest | null;
  readonly onCancel: () => void;
  readonly onConfirm: (value: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const [value, setValue] = useState("");
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (request) {
      setValue(request.initialValue ?? "");
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
      }
    } else if (dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [request]);
  return (
    <dialog
      aria-describedby={request?.description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-[var(--shadow-overlay)] backdrop:bg-[oklch(0.1_0.02_255/0.7)]"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      ref={dialogRef}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!request?.required || value.trim()) onConfirm(value);
        }}
      >
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-semibold" id={titleId}>
            {request?.title ?? "Enter details"}
          </h2>
          {request?.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground" id={descriptionId}>
              {request.description}
            </p>
          ) : null}
        </div>
        <div className="p-5">
          <label className="grid gap-2 text-sm font-semibold" htmlFor={inputId}>
            {request?.label ?? "Details"}
          </label>
          {request?.multiline ? (
            <textarea
              autoFocus
              className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3"
              id={inputId}
              onChange={(event) => setValue(event.target.value)}
              required={request.required}
              value={value}
            />
          ) : (
            <input
              autoFocus
              className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3"
              id={inputId}
              onChange={(event) => setValue(event.target.value)}
              required={request?.required}
              value={value}
            />
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">{request?.confirmLabel ?? "Save"}</Button>
        </div>
      </form>
    </dialog>
  );
}

export function TextEntryProvider({ children }: { readonly children: React.ReactNode }) {
  const [pending, setPending] = useState<{
    readonly request: TextEntryRequest;
    readonly resolve: (value: string | null) => void;
  } | null>(null);
  const requestText = useCallback(
    (request: TextEntryRequest) =>
      new Promise<string | null>((resolve) => setPending({ request, resolve })),
    [],
  );
  const finish = (value: string | null) => {
    pending?.resolve(value);
    setPending(null);
  };
  return (
    <TextEntryContext.Provider value={requestText}>
      {children}
      <TextEntryDialog
        onCancel={() => finish(null)}
        onConfirm={(value) => finish(value)}
        request={pending?.request ?? null}
      />
    </TextEntryContext.Provider>
  );
}

export function useTextEntry() {
  const context = useContext(TextEntryContext);
  if (!context) throw new Error("useTextEntry must be used within TextEntryProvider");
  return context;
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
