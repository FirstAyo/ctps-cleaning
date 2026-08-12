"use client";

import { ArrowLeft, ArrowRight, Save, Upload, X } from "@ctps/ui/icons";
import { Button } from "@ctps/ui/primitives";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import type { PublicMediaItem, PublicMediaPage } from "@/lib/marketing-types";

type UploadState = "READY" | "UPLOADING" | "COMPLETE" | "FAILED";
interface QueuedFile {
  id: string;
  file: File;
  preview: string;
  state: UploadState;
  message: string;
}

const filters = ["ALL", "RECENT", "UNUSED", "USED", "LANDSCAPE", "PORTRAIT", "SQUARE"] as const;
const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function readMediaPage(parameters: URLSearchParams) {
  const response = await fetch(`/api/media-library?${parameters}`, { cache: "no-store" });
  const result = (await response.json()) as PublicMediaPage & { message?: string };
  if (!response.ok) throw new Error(result.message ?? "The media library could not be loaded.");
  return result;
}

export function MediaAssetCard({
  item,
  selected,
  onSelect,
}: {
  readonly item: PublicMediaItem;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={`media-picker-card${selected ? " is-selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="media-picker-thumb">
        <Image
          alt={item.altText || ""}
          fill
          sizes="(min-width: 1024px) 12rem, 42vw"
          src={`/api/marketing-media/${item.id}/thumbnail`}
          style={{ objectPosition: `${item.focalPointX}% ${item.focalPointY}%` }}
        />
      </span>
      <strong>{item.title}</strong>
      <span>
        {item.width} × {item.height} · {formatBytes(item.sizeBytes)}
      </span>
      <span>{item.usageCount ? `Used ${item.usageCount} times` : "Unused"}</span>
    </button>
  );
}

export function MediaUploadQueue({
  canUpload,
  onUploaded,
}: {
  readonly canUpload: boolean;
  readonly onUploaded: (items: PublicMediaItem[]) => void;
}) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const queueRef = useRef<QueuedFile[]>([]);
  const inputId = useId();
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(
    () => () => {
      for (const item of queueRef.current) URL.revokeObjectURL(item.preview);
    },
    [],
  );
  const add = (files: FileList | null) => {
    if (!files) return;
    setQueue((current) => [
      ...current,
      ...[...files].map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        state: "READY" as const,
        message: "Ready",
      })),
    ]);
  };
  const remove = (id: string) =>
    setQueue((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  const upload = async () => {
    const ready = queue.filter((item) => item.state === "READY" || item.state === "FAILED");
    if (!ready.length) return;
    setQueue((current) =>
      current.map((item) =>
        ready.some(({ id }) => id === item.id)
          ? { ...item, state: "UPLOADING", message: "Uploading and processing" }
          : item,
      ),
    );
    const body = new FormData();
    for (const item of ready) body.append("files", item.file);
    try {
      const response = await fetch("/api/media-library", { method: "POST", body });
      const result = (await response.json()) as {
        items?: PublicMediaItem[];
        failures?: Array<{ filename: string; message: string }>;
        message?: string;
      };
      if (!response.ok || !result.items) throw new Error(result.message ?? "Upload failed.");
      const successes = [...result.items];
      setQueue((current) =>
        current.map((item) => {
          if (!ready.some(({ id }) => id === item.id)) return item;
          const failure = result.failures?.find(({ filename }) => filename === item.file.name);
          return failure
            ? { ...item, state: "FAILED", message: failure.message }
            : { ...item, state: "COMPLETE", message: "Complete" };
        }),
      );
      onUploaded(successes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setQueue((current) =>
        current.map((item) =>
          ready.some(({ id }) => id === item.id) ? { ...item, state: "FAILED", message } : item,
        ),
      );
    }
  };
  if (!canUpload) return null;
  return (
    <section className="media-upload-queue" aria-labelledby={`${inputId}-title`}>
      <div>
        <h3 id={`${inputId}-title`}>Upload new images</h3>
        <p>JPEG, PNG, or WebP. Processing and optimization happen automatically.</p>
      </div>
      <label className="media-upload-button" htmlFor={inputId}>
        <Upload aria-hidden="true" size={17} /> Choose images
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        id={inputId}
        multiple
        onChange={(event) => add(event.target.files)}
        type="file"
      />
      {queue.length ? (
        <ul className="media-upload-list">
          {queue.map((item) => (
            <li key={item.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img alt="" src={item.preview} />
              <div>
                <strong>{item.file.name}</strong>
                <span>
                  {formatBytes(item.file.size)} · {item.message}
                </span>
              </div>
              <button
                aria-label={`Remove ${item.file.name}`}
                disabled={item.state === "UPLOADING"}
                onClick={() => remove(item.id)}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {queue.some((item) => item.state === "READY" || item.state === "FAILED") ? (
        <Button onClick={upload}>Upload and process</Button>
      ) : null}
    </section>
  );
}

export function FocalPointEditor({
  item,
  canUpdate,
  onChange,
}: {
  readonly item: PublicMediaItem;
  readonly canUpdate: boolean;
  readonly onChange: (item: PublicMediaItem) => void;
}) {
  const [draft, setDraft] = useState(item);
  const [message, setMessage] = useState("");
  const position = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!canUpdate) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setDraft((current) => ({
      ...current,
      focalPointX: Math.round(((event.clientX - bounds.left) / bounds.width) * 100),
      focalPointY: Math.round(((event.clientY - bounds.top) / bounds.height) * 100),
    }));
  };
  const save = async () => {
    const response = await fetch(`/api/admin/media-library/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        altText: draft.altText,
        caption: draft.caption,
        focalPointX: draft.focalPointX,
        focalPointY: draft.focalPointY,
      }),
    });
    const result = (await response.json()) as PublicMediaItem & { message?: string };
    if (!response.ok) return setMessage(result.message ?? "Image details could not be saved.");
    onChange(result);
    setMessage("Image details saved.");
  };
  return (
    <div className="media-picker-details">
      <button
        className="focal-point-preview"
        disabled={!canUpdate}
        onPointerDown={position}
        type="button"
      >
        <Image
          alt={draft.altText || ""}
          fill
          sizes="24rem"
          src={`/api/marketing-media/${draft.id}/standard`}
          style={{ objectPosition: `${draft.focalPointX}% ${draft.focalPointY}%` }}
        />
        <span
          aria-hidden="true"
          style={{ left: `${draft.focalPointX}%`, top: `${draft.focalPointY}%` }}
        />
        <span className="sr-only">Click or tap the image to position its focal point.</span>
      </button>
      <dl>
        <div>
          <dt>Dimensions</dt>
          <dd>
            {draft.width} × {draft.height}
          </dd>
        </div>
        <div>
          <dt>Optimized original</dt>
          <dd>{formatBytes(draft.sizeBytes)}</dd>
        </div>
        <div>
          <dt>Usage</dt>
          <dd>{draft.usageCount}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{draft.mimeType}</dd>
        </div>
        <div>
          <dt>Uploaded</dt>
          <dd>{new Date(draft.createdAt).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt>Uploaded by</dt>
          <dd>{draft.uploadedBy ?? "CTPS staff"}</dd>
        </div>
      </dl>
      <section className="media-variant-list">
        <h3>Generated variants</h3>
        <ul>
          {Object.entries(draft.variants).map(([kind, variant]) => (
            <li key={kind}>
              <strong>{kind}</strong>
              <span>
                {variant.width} × {variant.height} · {formatBytes(variant.sizeBytes)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <label className="cms-field">
        <span>Title</span>
        <input
          disabled={!canUpdate}
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
      </label>
      <label className="cms-field">
        <span>Default alt text</span>
        <textarea
          disabled={!canUpdate}
          rows={2}
          value={draft.altText}
          onChange={(event) => setDraft((current) => ({ ...current, altText: event.target.value }))}
        />
      </label>
      <label className="cms-field">
        <span>Optional caption</span>
        <textarea
          disabled={!canUpdate}
          rows={2}
          value={draft.caption ?? ""}
          onChange={(event) =>
            setDraft((current) => ({ ...current, caption: event.target.value || null }))
          }
        />
      </label>
      <div className="focal-range-grid">
        <label>
          <span>Horizontal focal point: {draft.focalPointX}%</span>
          <input
            disabled={!canUpdate}
            min="0"
            max="100"
            type="range"
            value={draft.focalPointX}
            onChange={(event) =>
              setDraft((current) => ({ ...current, focalPointX: Number(event.target.value) }))
            }
          />
        </label>
        <label>
          <span>Vertical focal point: {draft.focalPointY}%</span>
          <input
            disabled={!canUpdate}
            min="0"
            max="100"
            type="range"
            value={draft.focalPointY}
            onChange={(event) =>
              setDraft((current) => ({ ...current, focalPointY: Number(event.target.value) }))
            }
          />
        </label>
      </div>
      {canUpdate ? (
        <div className="flex gap-2">
          <Button onClick={save}>
            <Save aria-hidden="true" size={16} /> Save details
          </Button>
          <Button
            onClick={() =>
              setDraft((current) => ({ ...current, focalPointX: 50, focalPointY: 50 }))
            }
            variant="outline"
          >
            Reset focal point
          </Button>
        </div>
      ) : null}
      {message ? (
        <p aria-live="polite" className="text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function MediaPickerDialog({
  initialItems,
  selectedIds,
  maxSelections,
  canUpload,
  canUpdate,
  onUse,
}: {
  readonly initialItems: readonly PublicMediaItem[];
  readonly selectedIds: readonly string[];
  readonly maxSelections: number;
  readonly canUpload: boolean;
  readonly canUpdate: boolean;
  readonly onUse: (ids: string[], items: PublicMediaItem[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [items, setItems] = useState([...initialItems]);
  const [selection, setSelection] = useState([...selectedIds]);
  const [active, setActive] = useState<PublicMediaItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [message, setMessage] = useState("");
  const load = async (nextPage = 1, nextSearch = search, nextFilter = filter) => {
    setMessage("Loading images…");
    try {
      const parameters = new URLSearchParams({
        page: String(nextPage),
        pageSize: "24",
        search: nextSearch,
        filter: nextFilter,
        status: "READY",
      });
      const result = await readMediaPage(parameters);
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setMessage(result.items.length ? "" : "No marketing images match these filters.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The media library could not be loaded.");
    }
  };
  const open = () => {
    setSelection([...selectedIds]);
    dialog.current?.showModal();
    void load(1);
  };
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  const toggle = (item: PublicMediaItem) => {
    setActive(item);
    void fetch(`/api/media-library?id=${item.id}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.ok) setActive((await response.json()) as PublicMediaItem);
      })
      .catch(() => undefined);
    setSelection((current) => {
      if (current.includes(item.id)) return current.filter((id) => id !== item.id);
      if (maxSelections === 1) return [item.id];
      return current.length >= maxSelections ? current : [...current, item.id];
    });
  };
  const uploaded = (newItems: PublicMediaItem[]) => {
    setItems((current) => [...newItems, ...current]);
    setSelection((current) =>
      [...current, ...newItems.map(({ id }) => id)].slice(0, maxSelections),
    );
    setActive(newItems[0] ?? null);
  };
  return (
    <>
      <div className="media-picker-triggers">
        <Button onClick={open} ref={trigger} type="button" variant="outline">
          Choose from Media Library
        </Button>
        {canUpload ? (
          <Button onClick={open} type="button" variant="outline">
            <Upload aria-hidden="true" size={16} /> Upload New Image
          </Button>
        ) : null}
      </div>
      <dialog className="media-picker-dialog" onCancel={close} ref={dialog}>
        <header>
          <div>
            <p className="eyebrow">Public Media Library</p>
            <h2>Choose marketing photography</h2>
            <p>Select existing optimized media or upload new images without leaving the editor.</p>
          </div>
          <button aria-label="Close media picker" onClick={close} type="button">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="media-picker-toolbar">
          <label>
            <span>Search title, filename, or alt text</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void load(1);
                }
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
                void load(1, search, next);
              }}
            >
              {filters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <Button onClick={() => load(1)} type="button">
            Search
          </Button>
        </div>
        <div className="media-picker-layout">
          <div>
            <div className="media-picker-grid">
              {items.map((item) => (
                <MediaAssetCard
                  item={item}
                  key={item.id}
                  onSelect={() => toggle(item)}
                  selected={selection.includes(item.id)}
                />
              ))}
            </div>
            {message ? (
              <p aria-live="polite" className="media-picker-message">
                {message}
              </p>
            ) : null}
            <nav aria-label="Media pages" className="media-picker-pagination">
              <Button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                size="sm"
                variant="outline"
              >
                <ArrowLeft aria-hidden="true" size={16} /> Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
                size="sm"
                variant="outline"
              >
                Next <ArrowRight aria-hidden="true" size={16} />
              </Button>
            </nav>
            <MediaUploadQueue canUpload={canUpload} onUploaded={uploaded} />
          </div>
          <aside>
            {active ? (
              <FocalPointEditor
                canUpdate={canUpdate}
                item={active}
                key={active.id}
                onChange={(updated) => {
                  setActive(updated);
                  setItems((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                  );
                }}
              />
            ) : (
              <p>Select an image to review its metadata and focal point.</p>
            )}
          </aside>
        </div>
        <footer>
          <span aria-live="polite">
            {selection.length} of {maxSelections} selected
          </span>
          <div>
            <Button onClick={close} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!selection.length}
              onClick={() => {
                onUse(selection, items);
                close();
              }}
            >
              Use {selection.length === 1 ? "This Image" : "Selected Images"}
            </Button>
          </div>
        </footer>
      </dialog>
    </>
  );
}

export function MarketingImageField({
  label,
  guidance,
  slotLabels,
  selectedIds,
  media,
  maxSelections,
  canUpload,
  canUpdate,
  onChange,
}: {
  readonly label: string;
  readonly guidance: string;
  readonly slotLabels?: readonly string[];
  readonly selectedIds: readonly string[];
  readonly media: readonly PublicMediaItem[];
  readonly maxSelections: number;
  readonly canUpload: boolean;
  readonly canUpdate: boolean;
  readonly onChange: (ids: string[]) => void;
}) {
  const [known, setKnown] = useState([...media]);
  const move = (index: number, direction: -1 | 1) => {
    const next = [...selectedIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };
  return (
    <fieldset className="marketing-image-field sm:col-span-2">
      <legend>{label}</legend>
      <p>{guidance}</p>
      {selectedIds.length ? (
        <ol>
          {selectedIds.map((id, index) => {
            const item = known.find((candidate) => candidate.id === id);
            return (
              <li key={id}>
                <span>{slotLabels?.[index] ?? `Image ${index + 1}`}</span>
                {item ? (
                  <Image
                    alt={item.altText || ""}
                    height={90}
                    width={120}
                    src={`/api/marketing-media/${id}/thumbnail`}
                  />
                ) : (
                  <span className="media-missing-preview">Selected media</span>
                )}
                <strong>{item?.title ?? id}</strong>
                <div>
                  <Button
                    aria-label={`Move ${slotLabels?.[index] ?? `image ${index + 1}`} earlier`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    size="icon"
                    variant="outline"
                  >
                    <ArrowLeft aria-hidden="true" size={15} />
                  </Button>
                  <Button
                    aria-label={`Move ${slotLabels?.[index] ?? `image ${index + 1}`} later`}
                    disabled={index === selectedIds.length - 1}
                    onClick={() => move(index, 1)}
                    size="icon"
                    variant="outline"
                  >
                    <ArrowRight aria-hidden="true" size={15} />
                  </Button>
                  <Button
                    aria-label={`Remove ${slotLabels?.[index] ?? `image ${index + 1}`}`}
                    onClick={() => onChange(selectedIds.filter((candidate) => candidate !== id))}
                    size="icon"
                    variant="outline"
                  >
                    <X aria-hidden="true" size={15} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="marketing-image-empty">
          No image selected. Development uses a local fallback; production uses a restrained neutral
          treatment.
        </p>
      )}
      <MediaPickerDialog
        canUpdate={canUpdate}
        canUpload={canUpload}
        initialItems={known}
        maxSelections={maxSelections}
        onUse={(ids, items) => {
          setKnown((current) => [
            ...items,
            ...current.filter((item) => !items.some(({ id }) => id === item.id)),
          ]);
          onChange(ids);
        }}
        selectedIds={selectedIds}
      />
    </fieldset>
  );
}
