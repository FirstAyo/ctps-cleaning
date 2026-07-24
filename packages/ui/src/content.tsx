import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-card text-card-foreground shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1 p-5", className)} {...props} />;
}
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function Badge({
  className,
  children,
  tone = "neutral",
}: {
  readonly className?: string;
  readonly children: ReactNode;
  readonly tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-muted text-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    danger: "bg-destructive/12 text-destructive",
    info: "bg-info/12 text-info",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  className,
  title,
  children,
  tone = "info",
}: {
  readonly className?: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly tone?: "info" | "success" | "warning" | "danger";
}) {
  const tones = {
    info: "border-info/40 bg-info/8",
    success: "border-success/40 bg-success/8",
    warning: "border-warning/40 bg-warning/8",
    danger: "border-destructive/40 bg-destructive/8",
  };
  return (
    <div
      className={cn("rounded-md border p-4", tones[tone], className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function Separator({ className }: { readonly className?: string }) {
  return <hr className={cn("border-0 border-t border-border", className)} />;
}
export function Avatar({
  label,
  className,
}: {
  readonly label: string;
  readonly className?: string;
}) {
  return (
    <span
      aria-label={label}
      className={cn(
        "inline-grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground",
        className,
      )}
      role="img"
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <span aria-hidden="true" className={cn("block animate-pulse rounded-md bg-muted", className)} />
  );
}

export function StatePanel({
  action,
  className,
  description,
  title,
  tone = "neutral",
}: {
  readonly action?: ReactNode;
  readonly className?: string;
  readonly description: string;
  readonly title: string;
  readonly tone?: "neutral" | "error" | "loading";
}) {
  return (
    <div
      aria-busy={tone === "loading" || undefined}
      className={cn(
        "rounded-lg border border-dashed border-border bg-surface-muted/45 p-6 text-center",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
export const EmptyState = StatePanel;
export function ErrorState(props: Omit<React.ComponentProps<typeof StatePanel>, "tone">) {
  return <StatePanel tone="error" {...props} />;
}
export function LoadingState(props: Omit<React.ComponentProps<typeof StatePanel>, "tone">) {
  return <StatePanel tone="loading" {...props} />;
}
export function Callout(props: React.ComponentProps<typeof Alert>) {
  return <Alert {...props} />;
}
