"use client";
import { useState } from "react";
import { Button } from "@ctps/ui/primitives";
import { Save } from "@ctps/ui/icons";

interface Item {
  systemKey: string;
  label: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
  version: number;
}
export function NavigationManager({
  initialItems,
  editable,
}: {
  readonly initialItems: readonly Item[];
  readonly editable: boolean;
}) {
  const [items, setItems] = useState([...initialItems]);
  const [message, setMessage] = useState("");
  const update = (index: number, change: Partial<Item>) =>
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...change } : item)),
    );
  const save = async () => {
    const response = await fetch("/api/admin/navigation", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const result = (await response.json()) as { items?: Item[]; message?: string };
    if (response.ok && result.items) setItems(result.items);
    setMessage(response.ok ? "Navigation saved." : (result.message ?? "Save failed."));
  };
  return (
    <div className="grid gap-5">
      <div className="cms-toolbar">
        <div>
          <p className="eyebrow">Website</p>
          <h2 className="mt-1 text-3xl font-semibold">Primary navigation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Labels, visibility, and order are controlled; destination routes remain fixed.
          </p>
        </div>
        {editable ? (
          <Button onClick={save}>
            <Save aria-hidden="true" className="size-4" /> Save navigation
          </Button>
        ) : null}
      </div>
      {message ? (
        <p aria-live="polite" className="rounded-md border p-3 text-sm">
          {message}
        </p>
      ) : null}
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div
            className="grid items-end gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_1fr_8rem_7rem]"
            key={item.systemKey}
          >
            <label className="cms-field">
              <span>Label</span>
              <input
                disabled={!editable}
                value={item.label}
                onChange={(event) => update(index, { label: event.target.value })}
              />
            </label>
            <label className="cms-field">
              <span>Fixed destination</span>
              <input disabled value={item.href} />
            </label>
            <label className="cms-field">
              <span>Order</span>
              <input
                disabled={!editable}
                min="0"
                type="number"
                value={item.sortOrder}
                onChange={(event) => update(index, { sortOrder: Number(event.target.value) })}
              />
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
              <input
                checked={item.enabled}
                disabled={!editable}
                onChange={(event) => update(index, { enabled: event.target.checked })}
                type="checkbox"
              />{" "}
              Visible
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
