import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef } from "react";

import { cn } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-primary-foreground hover:brightness-105",
  secondary: "border-secondary bg-secondary text-secondary-foreground hover:brightness-110",
  outline: "border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
  destructive: "border-destructive bg-destructive text-white hover:brightness-110",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  icon: "size-11 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    disabled,
    loading = false,
    size = "md",
    type = "button",
    variant = "primary",
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition-[background-color,color,border-color,transform] duration-200 enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      ref={ref}
      type={type}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      <span>{children}</span>
      {loading ? <span className="sr-only">Loading</span> : null}
    </button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { readonly "aria-label": string }
>(function IconButton({ "aria-label": ariaLabel, ...props }, ref) {
  return <Button aria-label={ariaLabel} ref={ref} size="icon" variant="ghost" {...props} />;
});

export function LinkButton({
  className,
  variant = "primary",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { readonly variant?: ButtonVariant }) {
  return (
    <a
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold no-underline transition-colors",
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

const control =
  "min-h-11 w-full rounded-md border border-input bg-surface px-3 text-foreground shadow-[var(--shadow-sm)] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-55";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-28 py-2", className)} {...props} />;
}
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, className)} {...props}>
      {children}
    </select>
  );
}
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("size-5 accent-primary", className)} type="checkbox" {...props} />;
}
export function Switch({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("h-6 w-11 cursor-pointer accent-primary", className)}
      role="switch"
      type="checkbox"
      {...props}
    />
  );
}
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}
export function FormDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}
export function FormError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm font-medium text-destructive", className)}
      role="alert"
      {...props}
    />
  );
}
export function FieldGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function RadioCard({
  className,
  label,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string;
  readonly description?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer gap-3 rounded-md border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/30",
        className,
      )}
    >
      <input className="mt-1 accent-primary" type="radio" {...props} />
      <span>
        <span className="block font-semibold">{label}</span>
        {description ? (
          <span className="block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
