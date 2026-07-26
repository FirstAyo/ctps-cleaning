"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

async function mutate(path: string, method: string, body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    message?: string;
    conflicts?: unknown[];
  };
  if (!response.ok) throw new Error(result.message ?? "The action failed.");
  return result;
}
const nextStatuses: Record<string, string[]> = {
  DRAFT: ["READY_TO_SCHEDULE"],
  READY_TO_SCHEDULE: ["DRAFT"],
  SCHEDULED: ["CONFIRMED", "EN_ROUTE"],
  CONFIRMED: ["EN_ROUTE", "ARRIVED"],
  EN_ROUTE: ["ARRIVED"],
  ARRIVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["PAUSED"],
  PAUSED: ["IN_PROGRESS"],
  COMPLETED: ["FOLLOW_UP_REQUIRED", "CLOSED", "ARCHIVED"],
  FOLLOW_UP_REQUIRED: ["IN_PROGRESS", "COMPLETED", "CLOSED", "ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};
export function JobActions({
  jobId,
  version,
  status,
  permissions,
  staff,
}: {
  jobId: string;
  version: number;
  status: string;
  permissions: readonly string[];
  staff: readonly { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">Operational actions</h2>
      {message ? (
        <p aria-live="polite" className="text-sm">
          {message}
        </p>
      ) : null}
      {permissions.includes("jobs.schedule") || permissions.includes("jobs.reschedule") ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(() =>
              mutate(`jobs/${jobId}/schedule`, "POST", {
                version,
                startLocal: data.get("startLocal"),
                estimatedDurationMinutes: Number(data.get("duration")),
                reason: data.get("reason"),
                disambiguation: data.get("disambiguation") || undefined,
                overrideConflict: false,
              }),
            );
          }}
        >
          <h3 className="font-semibold">Schedule in America/Vancouver</h3>
          <label className="grid gap-1 text-sm">
            Local start
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3"
              name="startLocal"
              required
              type="datetime-local"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Estimated minutes
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3"
              defaultValue="180"
              max="960"
              min="30"
              name="duration"
              required
              type="number"
            />
          </label>
          <label className="grid gap-1 text-sm">
            DST occurrence
            <select
              className="min-h-10 rounded-md border border-input bg-background px-3"
              name="disambiguation"
            >
              <option value="">Normal</option>
              <option value="earlier">Earlier repeated time</option>
              <option value="later">Later repeated time</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Reason
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3"
              name="reason"
              required
            />
          </label>
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
          >
            Check conflicts and save
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.assign") ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(() =>
              mutate(`jobs/${jobId}/assignments`, "POST", {
                userId: data.get("userId"),
                assignmentRole: data.get("assignmentRole"),
              }),
            );
          }}
        >
          <h3 className="font-semibold">Assign staff</h3>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="userId"
          >
            {staff.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="assignmentRole"
          >
            <option>LEAD</option>
            <option>CREW_MEMBER</option>
            <option>COORDINATOR</option>
          </select>
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
          >
            Assign
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.changeStatus") && nextStatuses[status]?.length ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(() =>
              mutate(`jobs/${jobId}/status`, "POST", {
                version,
                status: data.get("status"),
                reason: data.get("reason") || undefined,
              }),
            );
          }}
        >
          <h3 className="font-semibold">Lifecycle</h3>
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="status"
          >
            {nextStatuses[status]!.map((next) => (
              <option key={next}>{next}</option>
            ))}
          </select>
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="reason"
            placeholder="Reason where applicable"
          />
          <button
            className="min-h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
            disabled={busy}
          >
            Change status
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.manageChecklist") ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void run(() =>
              mutate(`jobs/${jobId}/checklist`, "POST", {
                label: data.get("label"),
                category: data.get("category"),
                required: data.get("required") === "on",
              }),
            ).then(() => form.reset());
          }}
        >
          <h3 className="font-semibold">Add checklist item</h3>
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="label"
            placeholder="Checklist item"
            required
          />
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="category"
          >
            <option>PREPARATION</option>
            <option>ARRIVAL</option>
            <option>SERVICE</option>
            <option>SAFETY</option>
            <option>CLEANUP</option>
            <option>COMPLETION</option>
          </select>
          <label className="flex gap-2 text-sm">
            <input name="required" type="checkbox" /> Required before completion
          </label>
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
          >
            Add item
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.addInternalNotes") ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void run(() =>
              mutate(`jobs/${jobId}/notes`, "POST", {
                visibility: "INTERNAL",
                body: data.get("body"),
              }),
            ).then(() => form.reset());
          }}
        >
          <h3 className="font-semibold">Private internal note</h3>
          <textarea
            className="min-h-24 rounded-md border border-input bg-background p-3"
            name="body"
            required
          />
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
          >
            Add private note
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.manageIncidents") ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void run(() =>
              mutate(`jobs/${jobId}/incidents`, "POST", {
                title: data.get("title"),
                description: data.get("description"),
                severity: data.get("severity"),
                blocksCompletion: data.get("blocksCompletion") === "on",
              }),
            ).then(() => form.reset());
          }}
        >
          <h3 className="font-semibold">Record incident</h3>
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="title"
            placeholder="Incident title"
            required
          />
          <textarea
            className="min-h-24 rounded-md border border-input bg-background p-3"
            name="description"
            required
          />
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3"
            name="severity"
          >
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
            <option>CRITICAL</option>
          </select>
          <label className="flex gap-2 text-sm">
            <input name="blocksCompletion" type="checkbox" /> Block completion until resolved
          </label>
          <button
            className="min-h-10 rounded-md border border-border px-4 font-semibold"
            disabled={busy}
          >
            Record incident
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.complete") &&
      ["IN_PROGRESS", "PAUSED", "FOLLOW_UP_REQUIRED"].includes(status) ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(() =>
              mutate(`jobs/${jobId}/complete`, "POST", {
                version,
                completionSummary: data.get("completionSummary"),
                followUpRequired: data.get("followUpRequired") === "on",
                followUpNotes: data.get("followUpNotes") || undefined,
              }),
            );
          }}
        >
          <h3 className="font-semibold">Complete service</h3>
          <textarea
            className="min-h-24 rounded-md border border-input bg-background p-3"
            minLength={10}
            name="completionSummary"
            required
          />
          <label className="flex gap-2 text-sm">
            <input name="followUpRequired" type="checkbox" /> Follow-up required
          </label>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background p-3"
            name="followUpNotes"
            placeholder="Follow-up notes"
          />
          <button
            className="min-h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
            disabled={busy}
          >
            Validate and complete
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.cancel") &&
      !["CANCELLED", "CLOSED", "ARCHIVED"].includes(status) ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            if (confirm("Cancel this job while preserving its history?"))
              void run(() =>
                mutate(`jobs/${jobId}/cancel`, "POST", {
                  version,
                  reason: data.get("reason"),
                  customerNote: data.get("customerNote") || undefined,
                  notifyCustomer: false,
                }),
              );
          }}
        >
          <h3 className="font-semibold text-destructive">Cancel job</h3>
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3"
            minLength={5}
            name="reason"
            placeholder="Required cancellation reason"
            required
          />
          <textarea
            className="min-h-20 rounded-md border border-input bg-background p-3"
            name="customerNote"
            placeholder="Optional customer-facing note"
          />
          <button
            className="min-h-10 rounded-md border border-destructive px-4 font-semibold text-destructive"
            disabled={busy}
          >
            Cancel job
          </button>
        </form>
      ) : null}
      {permissions.includes("jobs.manageCustomerNotifications") ? (
        <button
          className="min-h-10 rounded-md border border-border px-4 font-semibold"
          disabled={busy}
          onClick={() =>
            void run(() =>
              mutate(`jobs/${jobId}/notifications`, "POST", {
                type:
                  status === "CANCELLED"
                    ? "CANCELLED"
                    : status === "COMPLETED"
                      ? "COMPLETED"
                      : "SCHEDULED",
                idempotencyKey: crypto.randomUUID(),
              }),
            )
          }
          type="button"
        >
          Queue customer notification
        </button>
      ) : null}
    </div>
  );
}
