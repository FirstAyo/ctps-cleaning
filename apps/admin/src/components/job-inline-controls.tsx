/* eslint-disable @next/next/no-img-element -- local object-URL previews are not compatible with next/image */
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

async function mutate(path: string, method: string, body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "The action failed.");
}
export function JobChecklistControls({
  jobId,
  version,
  items,
  canManage,
}: {
  jobId: string;
  version: number;
  items: readonly { id: string; label: string; completed: boolean; required: boolean }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  if (!canManage) return null;
  async function run(id: string, body: unknown) {
    try {
      await mutate(`jobs/${jobId}/checklist/${id}`, "PATCH", body);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The action failed.");
    }
  }
  return (
    <div className="grid gap-2">
      {message ? (
        <p aria-live="assertive" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
      {items.map((item, index) => (
        <div className="flex flex-wrap items-center gap-2" key={item.id}>
          <button
            className="rounded border border-border px-2 py-1 text-xs"
            onClick={() => void run(item.id, { version, completed: !item.completed })}
            type="button"
          >
            {item.completed ? "Mark incomplete" : "Complete"}
          </button>
          <button
            aria-label={`Move ${item.label} up`}
            className="rounded border border-border px-2 py-1 text-xs"
            disabled={index === 0}
            onClick={() => void run(item.id, { version, direction: "up" })}
            type="button"
          >
            Move up
          </button>
          <button
            aria-label={`Move ${item.label} down`}
            className="rounded border border-border px-2 py-1 text-xs"
            disabled={index === items.length - 1}
            onClick={() => void run(item.id, { version, direction: "down" })}
            type="button"
          >
            Move down
          </button>
        </div>
      ))}
    </div>
  );
}
export function JobAssignmentControls({
  jobId,
  assignments,
  canManage,
}: {
  jobId: string;
  assignments: readonly {
    id: string;
    user: { displayName: string };
    assignmentRole: string;
    unassignedAt: string | null;
  }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  if (!canManage) return null;
  return (
    <div className="grid gap-2">
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {assignments
        .filter((item) => !item.unassignedAt)
        .map((item) => (
          <button
            className="justify-self-start text-sm underline"
            key={item.id}
            onClick={async () => {
              try {
                await mutate(`jobs/${jobId}/assignments/${item.id}`, "DELETE");
                router.refresh();
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "The action failed.");
              }
            }}
            type="button"
          >
            Remove {item.user.displayName} ({item.assignmentRole})
          </button>
        ))}
    </div>
  );
}
export function JobIncidentControls({
  jobId,
  incidents,
  canManage,
}: {
  jobId: string;
  incidents: readonly { id: string; title: string; resolvedAt: string | null }[];
  canManage: boolean;
}) {
  const router = useRouter();
  if (!canManage) return null;
  return (
    <div className="grid gap-2">
      {incidents
        .filter((item) => !item.resolvedAt)
        .map((item) => (
          <button
            className="justify-self-start text-sm underline"
            key={item.id}
            onClick={async () => {
              const resolutionNotes = prompt(`Resolution notes for ${item.title}`);
              if (!resolutionNotes) return;
              await mutate(`jobs/${jobId}/incidents/${item.id}`, "PATCH", {
                resolved: true,
                resolutionNotes,
              });
              router.refresh();
            }}
            type="button"
          >
            Resolve {item.title}
          </button>
        ))}
    </div>
  );
}
export function JobMediaUploader({ jobId, canUpload }: { jobId: string; canUpload: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  if (!canUpload) return null;
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setMessage("");
    const source = new FormData(event.currentTarget);
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    body.set("category", String(source.get("category")));
    body.set("altText", String(source.get("altText") ?? ""));
    const caption = String(source.get("caption") ?? "");
    if (caption) body.set("caption", caption);
    try {
      const response = await fetch(`/api/job-media/${jobId}`, { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Upload failed.");
      previews.forEach(({ url }) => URL.revokeObjectURL(url));
      setFiles([]);
      setMessage("Private photos uploaded.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. You can retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="grid gap-3" onSubmit={upload}>
      <label className="grid gap-1 text-sm font-semibold">
        Private job photos
        <input
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          type="file"
        />
      </label>
      {previews.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {previews.map(({ file, url }, index) => (
            <li
              className="rounded border border-border p-2"
              key={`${file.name}-${file.lastModified}`}
            >
              <img
                alt="Local preview; not yet uploaded"
                className="aspect-video w-full object-cover"
                src={url}
              />
              <p className="truncate text-xs">{file.name}</p>
              <button
                className="text-xs underline"
                onClick={() => {
                  URL.revokeObjectURL(url);
                  setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                }}
                type="button"
              >
                Remove before upload
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="grid gap-1 text-sm">
        Category
        <select
          className="min-h-10 rounded-md border border-input bg-background px-3"
          name="category"
        >
          <option>BEFORE</option>
          <option>DURING</option>
          <option>AFTER</option>
          <option>ACCESS</option>
          <option>ISSUE</option>
          <option>COMPLETION</option>
          <option>OTHER</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Alt text
        <input
          className="min-h-10 rounded-md border border-input bg-background px-3"
          maxLength={300}
          name="altText"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Caption
        <input
          className="min-h-10 rounded-md border border-input bg-background px-3"
          maxLength={500}
          name="caption"
        />
      </label>
      {message ? (
        <p aria-live="polite" className="text-sm">
          {message}
        </p>
      ) : null}
      <button
        className="min-h-10 rounded-md border border-border px-4 font-semibold"
        disabled={busy || !files.length}
      >
        {busy ? "Uploading…" : "Upload private photos"}
      </button>
    </form>
  );
}

export function JobMediaControls({
  jobId,
  media,
  canUpdate,
  canDelete,
}: {
  jobId: string;
  media: readonly { id: string; altText: string; caption: string | null }[];
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function run(path: string, method: string, body?: unknown) {
    try {
      await mutate(path, method, body);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The action failed.");
    }
  }
  return (
    <div className="mt-3 grid gap-2">
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {media.map((item, index) => (
        <div className="flex flex-wrap gap-2" key={item.id}>
          {canUpdate ? (
            <>
              <button
                className="text-xs underline"
                disabled={index === 0}
                onClick={() =>
                  void run(`jobs/${jobId}/media/${item.id}`, "PATCH", { direction: "up" })
                }
                type="button"
              >
                Move up
              </button>
              <button
                className="text-xs underline"
                disabled={index === media.length - 1}
                onClick={() =>
                  void run(`jobs/${jobId}/media/${item.id}`, "PATCH", { direction: "down" })
                }
                type="button"
              >
                Move down
              </button>
              <button
                className="text-xs underline"
                onClick={() => {
                  const altText = prompt("Alt text", item.altText);
                  if (altText !== null)
                    void run(`jobs/${jobId}/media/${item.id}`, "PATCH", { altText });
                }}
                type="button"
              >
                Edit alt text
              </button>
              <button
                className="text-xs underline"
                onClick={() => {
                  const caption = prompt("Caption", item.caption ?? "");
                  if (caption !== null)
                    void run(`jobs/${jobId}/media/${item.id}`, "PATCH", {
                      caption: caption || null,
                    });
                }}
                type="button"
              >
                Edit caption
              </button>
            </>
          ) : null}
          {canDelete ? (
            <button
              className="text-xs text-destructive underline"
              onClick={() => {
                if (confirm("Permanently remove this private job photo?"))
                  void run(`jobs/${jobId}/media/${item.id}`, "DELETE");
              }}
              type="button"
            >
              Delete private photo
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function JobNoteControls({
  jobId,
  notes,
  currentUserId,
  canUpdateJob,
  canManageInternal,
}: {
  jobId: string;
  notes: readonly { id: string; body: string; visibility: string; author: { id: string } }[];
  currentUserId: string;
  canUpdateJob: boolean;
  canManageInternal: boolean;
}) {
  const router = useRouter();
  return (
    <div className="mt-3 grid gap-2">
      {notes.map((note) => {
        const allowed =
          note.visibility === "CUSTOMER_FACING"
            ? canUpdateJob
            : canManageInternal && (note.author.id === currentUserId || canUpdateJob);
        return allowed ? (
          <div className="flex gap-3" key={note.id}>
            <button
              className="text-xs underline"
              onClick={async () => {
                const body = prompt("Update note", note.body);
                if (body) {
                  await mutate(`jobs/${jobId}/notes/${note.id}`, "PATCH", { body });
                  router.refresh();
                }
              }}
              type="button"
            >
              Edit note
            </button>
            <button
              className="text-xs text-destructive underline"
              onClick={async () => {
                if (confirm("Remove this note from the operational record?")) {
                  await mutate(`jobs/${jobId}/notes/${note.id}`, "DELETE");
                  router.refresh();
                }
              }}
              type="button"
            >
              Delete note
            </button>
          </div>
        ) : null;
      })}
    </div>
  );
}
