export interface StatusBadgeProps {
  readonly label: string;
  readonly state: "available" | "unavailable" | "unknown";
}

const stateClasses: Record<StatusBadgeProps["state"], string> = {
  available: "border-emerald-300 bg-emerald-50 text-emerald-900",
  unavailable: "border-red-300 bg-red-50 text-red-900",
  unknown: "border-slate-300 bg-slate-50 text-slate-800",
};

export function StatusBadge({ label, state }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${stateClasses[state]}`}
      data-state={state}
    >
      {label}
    </span>
  );
}
