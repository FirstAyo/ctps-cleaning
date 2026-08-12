"use client";

import { Archive, RotateCcw, Trash2 } from "@ctps/ui/icons";
import { Button } from "@ctps/ui/primitives";
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
  const [result, setResult] = useState(initialPage);
  const [selected, setSelected] = useState<PublicMediaItem | null>(null);
  const [usage, setUsage] = useState<PublicMediaUsage["items"]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [status, setStatus] = useState<"READY" | "ARCHIVED">("READY");
  const [message, setMessage] = useState("");
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
    if (
      action === "delete" &&
      !window.confirm(`Permanently delete “${item.title}”? This cannot be undone.`)
    )
      return;
    const response = await fetch(
      `/api/admin/media-library/${item.id}${action === "delete" ? "" : `/${action}`}`,
      {
        method: action === "delete" ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        ...(action === "delete" ? {} : { body: "{}" }),
      },
    );
    const body = (await response.json()) as { message?: string };
    if (!response.ok) return setMessage(body.message ?? `The image could not be ${action}d.`);
    setSelected(null);
    setUsage([]);
    setMessage(`Image ${action === "delete" ? "deleted" : `${action}d`}.`);
    await load(result.page);
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
                  <Button onClick={() => mutation(selected, "archive")} variant="outline">
                    <Archive aria-hidden="true" size={16} /> Archive
                  </Button>
                ) : null}
                {selected.status === "ARCHIVED" && canRestore ? (
                  <Button onClick={() => mutation(selected, "restore")} variant="outline">
                    <RotateCcw aria-hidden="true" size={16} /> Restore
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    disabled={selected.usageCount > 0}
                    onClick={() => mutation(selected, "delete")}
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
    </div>
  );
}
