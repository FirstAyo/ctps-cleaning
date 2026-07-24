import type { HTMLAttributes } from "react";

import { cn } from "./utils";

export function Container({
  className,
  size = "content",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  readonly size?: "content" | "wide" | "reading" | "admin" | "form" | "full";
}) {
  const sizes = {
    content: "max-w-[var(--container-content)]",
    wide: "max-w-[var(--container-wide)]",
    reading: "max-w-[var(--container-reading)]",
    admin: "max-w-[var(--container-admin)]",
    form: "max-w-[var(--container-form)]",
    full: "max-w-none",
  };
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)} {...props} />
  );
}
export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-14 sm:py-20 lg:py-24", className)} {...props} />;
}
export function Stack({
  className,
  gap = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { readonly gap?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn(
        "flex flex-col",
        gap === "sm" ? "gap-2" : gap === "lg" ? "gap-8" : "gap-4",
        className,
      )}
      {...props}
    />
  );
}
export function Inline({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)} {...props} />;
}
export function ResponsiveGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)} {...props} />;
}
export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("sr-only", className)} {...props} />;
}
