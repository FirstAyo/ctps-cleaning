"use client";

import { useId, useState } from "react";

import { cn } from "./utils";

export function clampComparisonValue(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getNextComparisonValue(value: number, key: string, shiftKey = false) {
  const step = shiftKey ? 10 : 2;
  if (key === "Home") return 0;
  if (key === "End") return 100;
  if (key === "PageDown") return clampComparisonValue(value - 10);
  if (key === "PageUp") return clampComparisonValue(value + 10);
  if (key === "ArrowLeft" || key === "ArrowDown") return clampComparisonValue(value - step);
  if (key === "ArrowRight" || key === "ArrowUp") return clampComparisonValue(value + step);
  return value;
}

export function ImageComparison({
  before,
  after,
  className,
  initialValue = 50,
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  readonly before?: React.ReactNode;
  readonly after?: React.ReactNode;
  readonly className?: string;
  readonly initialValue?: number;
  readonly beforeLabel?: string;
  readonly afterLabel?: string;
}) {
  const [value, setValue] = useState(clampComparisonValue(initialValue));
  const instructionsId = useId();
  return (
    <figure className={cn("m-0", className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-muted">
        <div aria-hidden={!after} className="absolute inset-0">
          {after ?? (
            <div className="size-full bg-[linear-gradient(135deg,var(--surface-muted),var(--surface-elevated)_55%,var(--accent))]" />
          )}
        </div>
        <div
          aria-hidden={!before}
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          {before ?? (
            <div className="size-full bg-[linear-gradient(135deg,var(--secondary),var(--primary)_60%,var(--surface-muted))]" />
          )}
        </div>
        <span className="absolute left-3 top-3 rounded-sm bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">
          {beforeLabel}
        </span>
        <span className="absolute right-3 top-3 rounded-sm bg-surface-elevated px-2 py-1 text-xs font-bold text-foreground">
          {afterLabel}
        </span>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${value}%` }}
        >
          <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-primary text-sm font-bold text-primary-foreground shadow-md">
            ↔
          </span>
        </div>
        <input
          aria-describedby={instructionsId}
          aria-label="Before and after comparison"
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
          max="100"
          min="0"
          onChange={(event) => setValue(clampComparisonValue(event.currentTarget.valueAsNumber))}
          onKeyDown={(event) => {
            const next = getNextComparisonValue(value, event.key, event.shiftKey);
            if (next !== value) {
              event.preventDefault();
              setValue(next);
            }
          }}
          step="1"
          type="range"
          value={value}
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        <span id={instructionsId}>
          Drag, swipe, or use arrow keys. Home and End show either side.
        </span>
        <output aria-live="polite">{value}% before</output>
      </figcaption>
      <noscript>
        <p>Comparison controls require JavaScript. The labeled visual remains available.</p>
      </noscript>
    </figure>
  );
}
