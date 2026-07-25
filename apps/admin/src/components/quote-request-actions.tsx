"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const nextStatuses: Record<string, readonly string[]> = {
  NEW: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: [
    "MORE_INFORMATION_REQUIRED",
    "ESTIMATE_REVIEWED",
    "QUOTE_PREPARED",
    "CONTACTED",
    "CANCELLED",
  ],
  MORE_INFORMATION_REQUIRED: ["UNDER_REVIEW", "CONTACTED", "CANCELLED"],
  ESTIMATE_REVIEWED: ["QUOTE_PREPARED", "CONTACTED", "CANCELLED"],
  QUOTE_PREPARED: ["CONTACTED", "ACCEPTED", "DECLINED", "CANCELLED"],
  CONTACTED: ["UNDER_REVIEW", "QUOTE_PREPARED", "ACCEPTED", "DECLINED", "CLOSED", "CANCELLED"],
  ACCEPTED: ["CLOSED", "CANCELLED"],
  DECLINED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

async function mutate(path: string, method: string, body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "The action failed.");
  return result;
}
export function QuoteRequestActions({
  id,
  status,
  archived,
  assignees,
  permissions,
  assignedToUserId,
}: {
  id: string;
  status: string;
  archived: boolean;
  assignees: readonly { id: string; displayName: string; email: string }[];
  permissions: readonly string[];
  assignedToUserId: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      router.refresh();
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">Staff actions</h2>
      {message ? (
        <p aria-live="polite" className="text-sm">
          {message}
        </p>
      ) : null}
      {permissions.includes("quoteRequests.changeStatus") && nextStatuses[status]?.length ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void run(() =>
              mutate(`quote-requests/${id}/status`, "POST", { status: form.get("status") }),
            );
          }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Status
            <select
              className="min-h-10 rounded-md border border-input bg-background px-3"
              name="status"
            >
              {nextStatuses[status]!.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button
            className="min-h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
            disabled={busy}
            type="submit"
          >
            Change status
          </button>
        </form>
      ) : null}
      {permissions.includes("quoteRequests.assign") ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void run(() =>
              mutate(`quote-requests/${id}/assignment`, "PUT", {
                assignedToUserId: form.get("assignedToUserId") || null,
              }),
            );
          }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Assign to
            <select
              className="min-h-10 rounded-md border border-input bg-background px-3"
              defaultValue={assignedToUserId ?? ""}
              name="assignedToUserId"
            >
              <option value="">Unassigned</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} ({user.email})
                </option>
              ))}
            </select>
          </label>
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
            type="submit"
          >
            Save assignment
          </button>
        </form>
      ) : null}
      {permissions.includes("quoteRequests.addInternalNotes") ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void run(() =>
              mutate(`quote-requests/${id}/notes`, "POST", { body: data.get("body") }),
            ).then(() => form.reset());
          }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Internal note
            <textarea
              className="min-h-24 rounded-md border border-input bg-background p-3"
              maxLength={3000}
              name="body"
              required
            />
          </label>
          <button
            className="min-h-10 justify-self-start rounded-md border border-border px-4 font-semibold"
            disabled={busy}
            type="submit"
          >
            Add private note
          </button>
        </form>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {permissions.includes("quoteRequests.archive") ? (
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
            onClick={() =>
              void run(() => mutate(`quote-requests/${id}/archive`, "POST", { archive: !archived }))
            }
            type="button"
          >
            {archived ? "Restore" : "Archive"}
          </button>
        ) : null}
        {permissions.includes("quoteRequests.delete") && archived ? (
          <button
            className="min-h-10 rounded-md border border-destructive px-4 font-semibold text-destructive"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "Permanently delete this archived terminal request? This cannot be undone.",
                )
              )
                void run(() => mutate(`quote-requests/${id}`, "DELETE")).then(() =>
                  router.push("/quote-requests"),
                );
            }}
            type="button"
          >
            Delete permanently
          </button>
        ) : null}
      </div>
    </div>
  );
}
