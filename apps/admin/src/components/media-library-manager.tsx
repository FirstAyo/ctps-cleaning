"use client";

import { Archive, RotateCcw, Trash2 } from "@ctps/ui/icons";
import { ConfirmationDialog } from "@ctps/ui/navigation";
import { Button } from "@ctps/ui/primitives";
import { useToast } from "@ctps/ui/toast";
import { useState } from "react";

import type { PublicMediaItem, PublicMediaPage, PublicMediaUsage } from "@/lib/marketing-types";
import { FocalPointEditor, MediaAssetCard, MediaUploadQueue } from "./marketing-media-picker";

const filters = ["ALL", "RECENT", "UNUSED", "USED", "LANDSCAPE", "PORTRAIT", "SQUARE"] as const;

export function MediaLibraryManager({
  initialPage,
  canUpload,
  canUpdate,
  canArchive,
  canRestore,
  canDelete,
}: {
  readonly initialPage: PublicMediaPage;
  readonly canUpload: boolean;
  readonly canUpdate: boolean;
  readonly canArchive: boolean;
  readonly canRestore: boolean;
  readonly canDelete: boolean;
}) {
  const { toast } = useToast();
  const [result, setResult] = useState(initialPage);
  const [selected, setSelected] = useState<PublicMediaItem | null>(null);
  const [usage, setUsage] = useState<PublicMediaUsage["items"]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [status, setStatus] = useState<"READY" | "ARCHIVED">("READY");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    item: PublicMediaItem;
    action: "archive" | "restore" | "delete";
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const load = async (page = 1, nextFilter = filter, nextStatus = status) => {
    setMessage("Loading marketing images…");
    const parameters = new URLSearchParams({
      page: String(page),
      pageSize: "24",
      search,
      filter: nextFilter,
      status: nextStatus,
    });
    const response = await fetch(`/api/media-library?${parameters}`, { cache: "no-store" });
    const body = (await response.json()) as PublicMediaPage & { message?: string };
    if (!response.ok) return setMessage(body.message ?? "The media library could not be loaded.");
    setResult(body);
    setMessage("");
  };
  const select = async (item: PublicMediaItem) => {
    setSelected(item);
    const [detailResponse, usageResponse] = await Promise.all([
      fetch(`/api/media-library?id=${item.id}`, { cache: "no-store" }),
      fetch(`/api/media-library?id=${item.id}&usage=true`, { cache: "no-store" }),
    ]);
    if (detailResponse.ok) setSelected((await detailResponse.json()) as PublicMediaItem);
    const body = (await usageResponse.json()) as PublicMediaUsage;
    setUsage(usageResponse.ok ? body.items : []);
  };
  const mutation = async (item: PublicMediaItem, action: "archive" | "restore" | "delete") => {
    setMutating(true);
    try {
      const response = await fetch(
        `/api/admin/media-library/${item.id}${action === "delete" ? "" : `/${action}`}`,
        {
          method: action === "delete" ? "DELETE" : "POST",
          headers: { "content-type": "application/json" },
          ...(action === "delete" ? {} : { body: "{}" }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? `The image could not be ${action}d.`);
      setSelected(null);
      setUsage([]);
      setPendingAction(null);
      toast({
        title:
          action === "delete"
            ? "Image deleted"
            : action === "archive"
              ? "Image archived"
              : "Image restored",
        description:
          action === "delete"
            ? "The unused public image and all generated variants were removed."
            : `The image is now ${action === "archive" ? "hidden from active selection" : "available for selection"}.`,
        tone: "success",
      });
      await load(result.page);
    } catch (error) {
      const failure = error instanceof Error ? error.message : `The image could not be ${action}d.`;
      setMessage(failure);
      setPendingAction(null);
      toast({ title: "Image action failed", description: failure, tone: "error" });
    } finally {
      setMutating(false);
    }
  };
  const replaceItem = (updated: PublicMediaItem) => {
    setSelected(updated);
    setResult((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === updated.id ? updated : item)),
    }));
  };
  return (
    <div className="media-library-workspace">
      <div className="cms-toolbar">
        <div>
          <p className="eyebrow">Website</p>
          <h2 className="mt-1 text-3xl font-semibold">Public Media Library</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reusable public marketing images only. Private customer, Blog-draft, Before & After,
            quote, and job media never appears here.
          </p>
        </div>
      </div>
      <div className="media-library-controls">
        <label>
          <span>Search</span>
          <input
            placeholder="Title, filename, or alt text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void load(1);
            }}
          />
        </label>
        <label>
          <span>Filter</span>
          <select
            value={filter}
            onChange={(event) => {
              const next = event.target.value as (typeof filters)[number];
              setFilter(next);
              void load(1, next, status);
            }}
          >
            {filters.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>State</span>
          <select
            value={status}
            onChange={(event) => {
              const next = event.target.value as "READY" | "ARCHIVED";
              setStatus(next);
              void load(1, filter, next);
            }}
          >
            <option value="READY">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <Button onClick={() => load(1)}>Search</Button>
      </div>
      {message ? (
        <p aria-live="polite" className="rounded-md border p-3 text-sm">
          {message}
        </p>
      ) : null}
      <div className="media-library-layout">
        <div>
          <div className="media-picker-grid">
            {result.items.map((item) => (
              <MediaAssetCard
                item={item}
                key={item.id}
                onSelect={() => select(item)}
                selected={selected?.id === item.id}
              />
            ))}
          </div>
          {!result.items.length ? (
            <div className="media-library-empty">
              <h3>No marketing images yet.</h3>
              <p>Upload your first image or adjust the current search and filters.</p>
            </div>
          ) : null}
          <nav aria-label="Media library pages" className="media-picker-pagination">
            <Button
              disabled={result.page <= 1}
              onClick={() => load(result.page - 1)}
              variant="outline"
            >
              Previous
            </Button>
            <span>
              Page {result.page} of {result.totalPages} · {result.total} images
            </span>
            <Button
              disabled={result.page >= result.totalPages}
              onClick={() => load(result.page + 1)}
              variant="outline"
            >
              Next
            </Button>
          </nav>
          <MediaUploadQueue
            canUpload={canUpload}
            onUploaded={(items) => {
              setResult((current) => ({
                ...current,
                items: [...items, ...current.items].slice(0, current.pageSize),
                total: current.total + items.length,
              }));
              setMessage(
                `${items.length} image${items.length === 1 ? "" : "s"} uploaded and processed.`,
              );
            }}
          />
        </div>
        <aside className="media-library-detail-panel">
          {selected ? (
            <>
              <FocalPointEditor
                canUpdate={canUpdate}
                item={selected}
                key={selected.id}
                onChange={replaceItem}
              />
              <section className="media-usage-list">
                <h3>Usage references</h3>
                {usage.length ? (
                  <ul>
                    {usage.map((item, index) => (
                      <li key={`${item.pageKey}-${item.usage}-${index}`}>
                        <strong>{item.pageTitle}</strong>
                        <span>{item.usage.replaceAll(":", " → ")}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>This image is not currently referenced.</p>
                )}
              </section>
              <div className="media-library-actions">
                {selected.status === "READY" && canArchive ? (
                  <Button
                    onClick={() => setPendingAction({ item: selected, action: "archive" })}
                    variant="outline"
                  >
                    <Archive aria-hidden="true" size={16} /> Archive
                  </Button>
                ) : null}
                {selected.status === "ARCHIVED" && canRestore ? (
                  <Button
                    onClick={() => setPendingAction({ item: selected, action: "restore" })}
                    variant="outline"
                  >
                    <RotateCcw aria-hidden="true" size={16} /> Restore
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    disabled={selected.usageCount > 0}
                    onClick={() => setPendingAction({ item: selected, action: "delete" })}
                    variant="destructive"
                  >
                    <Trash2 aria-hidden="true" size={16} /> Delete permanently
                  </Button>
                ) : null}
              </div>
              {selected.usageCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  This image is currently used in {selected.usageCount} places. Remove or replace
                  every reference before deletion.
                </p>
              ) : null}
            </>
          ) : (
            <p>
              Select an image to inspect metadata, focal point, variants, usage, and lifecycle
              actions.
            </p>
          )}
        </aside>
      </div>
      <ConfirmationDialog
        busy={mutating}
        confirmLabel={
          pendingAction?.action === "delete"
            ? "Delete permanently"
            : pendingAction?.action === "archive"
              ? "Archive image"
              : "Restore image"
        }
        description={
          pendingAction?.action === "delete"
            ? `Delete “${pendingAction.item.title}” and every generated variant? This cannot be undone.`
            : pendingAction?.action === "archive"
              ? `Archive “${pendingAction.item.title}”? It will no longer be available for new page selections.`
              : pendingAction
                ? `Restore “${pendingAction.item.title}” to the active media library?`
                : "Confirm this image action."
        }
        destructive={pendingAction?.action === "delete"}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) void mutation(pendingAction.item, pendingAction.action);
        }}
        open={Boolean(pendingAction)}
        title={
          pendingAction?.action === "delete"
            ? "Delete public image?"
            : pendingAction?.action === "archive"
              ? "Archive public image?"
              : "Restore public image?"
        }
      />
    </div>
  );
}
