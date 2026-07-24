export interface StatusBadgeProps {
  readonly label: string;
  readonly state: "available" | "unavailable" | "unknown";
}

const stateClasses: Record<StatusBadgeProps["state"], string> = {
  available: "border-success/40 bg-success/10 text-success",
  unavailable: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-surface-muted text-muted-foreground",
};

export function StatusBadge({ label, state }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-semibold ${stateClasses[state]}`}
      data-state={state}
    >
      <span aria-hidden="true">
        {state === "available" ? "✓" : state === "unavailable" ? "!" : "–"}
      </span>
      {label}
    </span>
  );
}
