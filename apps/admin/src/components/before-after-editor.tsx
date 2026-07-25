"use client";

/* eslint-disable @next/next/no-img-element -- previews include local object URLs and protected media routes */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImageComparison } from "@ctps/ui/image-comparison";
import {
  Button,
  Checkbox,
  FieldGroup,
  FormDescription,
  Input,
  Label,
  Select,
  Textarea,
} from "@ctps/ui/primitives";
import type { AdminMedia, AdminProject } from "@/lib/before-after-types";

type Category = "PRIMARY_BEFORE" | "PRIMARY_AFTER" | "BEFORE" | "AFTER" | "GALLERY";
interface ExistingItem {
  media: AdminMedia;
  category: Category;
  caption: string;
  removed: boolean;
}
interface PendingItem {
  id: string;
  file: File;
  url: string;
  category: Category;
  altText: string;
  caption: string;
  error: string;
  status: "selected" | "uploading" | "failed";
}
async function mutation(path: string, method: "POST" | "PATCH" | "PUT" | "DELETE", body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok)
    throw new Error(
      typeof result.message === "string" ? result.message : "The change could not be completed.",
    );
  return result;
}
function mediaSource(media: AdminMedia) {
  return `/api/admin-media/${media.id}/gallery`;
}
function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function BeforeAfterEditor({
  project,
  canUpload,
  canUpdateMedia,
  canDeleteMedia,
  canPublish,
  canArchive,
  canDelete,
}: {
  readonly project?: AdminProject;
  readonly canUpload: boolean;
  readonly canUpdateMedia: boolean;
  readonly canDeleteMedia: boolean;
  readonly canPublish: boolean;
  readonly canArchive: boolean;
  readonly canDelete: boolean;
}) {
  const initial: ExistingItem[] = [
    ...(project?.primaryBeforeMedia
      ? [
          {
            media: project.primaryBeforeMedia,
            category: "PRIMARY_BEFORE" as const,
            caption: project.primaryBeforeMedia.caption ?? "",
            removed: false,
          },
        ]
      : []),
    ...(project?.primaryAfterMedia
      ? [
          {
            media: project.primaryAfterMedia,
            category: "PRIMARY_AFTER" as const,
            caption: project.primaryAfterMedia.caption ?? "",
            removed: false,
          },
        ]
      : []),
    ...(project?.supportingMedia.map((item) => ({
      media: item.media,
      category: item.category,
      caption: item.caption ?? item.media.caption ?? "",
      removed: false,
    })) ?? []),
  ];
  const [existing, setExisting] = useState(initial);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current.clear();
    },
    [],
  );
  async function selectFiles(files: FileList | null) {
    if (!files) return;
    const available = Math.max(
      0,
      14 - existing.filter((item) => !item.removed).length - pending.length,
    );
    const selected = [...files].slice(0, available);
    const additions: PendingItem[] = [];
    for (const file of selected) {
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      let error = "";
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !["jpg", "jpeg", "png", "webp"].includes(ext ?? "")
      )
        error = "Use JPEG, PNG, or WebP. SVG and other formats are rejected.";
      else if (file.size > 10 * 1024 * 1024) error = "This file exceeds the 10 MB per-image limit.";
      if (!error) {
        try {
          const dimensions = await new Promise<{ width: number; height: number }>(
            (resolve, reject) => {
              const image = new Image();
              image.onload = () =>
                resolve({ width: image.naturalWidth, height: image.naturalHeight });
              image.onerror = reject;
              image.src = url;
            },
          );
          if (dimensions.width < 600 || dimensions.height < 400)
            error = "Minimum dimensions are 600 × 400 pixels.";
          if (dimensions.width > 12000 || dimensions.height > 12000)
            error = "Maximum dimensions are 12000 × 12000 pixels.";
        } catch {
          error = "The browser could not preview this image.";
        }
      }
      additions.push({
        id: crypto.randomUUID(),
        file,
        url,
        category: "GALLERY",
        altText: "",
        caption: "",
        error,
        status: "selected",
      });
    }
    if (files.length > available)
      setFeedback(`Only ${available} more images can be selected for this draft.`);
    setPending((items) => [...items, ...additions]);
    setDirty(true);
  }
  function removePending(id: string) {
    setPending((items) => {
      const item = items.find((candidate) => candidate.id === id);
      if (item) {
        URL.revokeObjectURL(item.url);
        urls.current.delete(item.url);
      }
      return items.filter((candidate) => candidate.id !== id);
    });
    setDirty(true);
  }
  function movePending(index: number, direction: -1 | 1) {
    setPending((items) => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return items;
      const next = [...items];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
    setDirty(true);
  }
  function moveExisting(index: number, direction: -1 | 1) {
    setExisting((items) => {
      const active = items.filter((item) => !item.removed);
      const current = active[index];
      const target = active[index + direction];
      if (!current || !target) return items;
      const next = [...items];
      const from = next.indexOf(current),
        to = next.indexOf(target);
      [next[from], next[to]] = [next[to]!, next[from]!];
      return next;
    });
    setDirty(true);
  }
  async function upload(item: PendingItem): Promise<AdminMedia> {
    setPending((items) =>
      items.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status: "uploading", error: "" } : candidate,
      ),
    );
    const body = new FormData();
    body.append("files", item.file);
    const response = await fetch("/api/media/before-after", { method: "POST", body });
    const result = (await response.json()) as { items?: AdminMedia[]; message?: string };
    if (!response.ok || !result.items?.[0]) {
      setPending((items) =>
        items.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                status: "failed",
                error: result.message ?? "Upload failed. Retry this image.",
              }
            : candidate,
        ),
      );
      throw new Error(result.message ?? `${item.file.name} could not be uploaded.`);
    }
    const media = result.items[0];
    if (canUpdateMedia && (item.altText || item.caption)) {
      const updated = await mutation(`media/before-after/${media.id}`, "PATCH", {
        altText: item.altText,
        caption: item.caption || null,
      });
      return updated as unknown as AdminMedia;
    }
    return { ...media, altText: item.altText, caption: item.caption || null };
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("Saving draft…");
    setFailed(false);
    const invalid = pending.filter((item) => item.error && item.status !== "failed");
    if (invalid.length) {
      setFeedback("Remove or correct invalid selected images before saving.");
      setFailed(true);
      return;
    }
    const selected = [...existing.filter((item) => !item.removed), ...pending];
    if (
      selected.filter((item) => item.category === "PRIMARY_BEFORE").length > 1 ||
      selected.filter((item) => item.category === "PRIMARY_AFTER").length > 1
    ) {
      setFeedback("Choose only one Primary Before image and one Primary After image.");
      setFailed(true);
      return;
    }
    try {
      const uploaded: ExistingItem[] = [];
      for (const item of pending) {
        const media = await upload(item);
        uploaded.push({ media, category: item.category, caption: item.caption, removed: false });
      }
      const kept = existing.filter((item) => !item.removed);
      if (canUpdateMedia)
        for (const item of kept)
          await mutation(`media/before-after/${item.media.id}`, "PATCH", {
            altText: item.media.altText,
            caption: item.caption || null,
          });
      const all = [...kept, ...uploaded];
      const before = all.find((item) => item.category === "PRIMARY_BEFORE")?.media.id ?? null;
      const after = all.find((item) => item.category === "PRIMARY_AFTER")?.media.id ?? null;
      const supporting = all
        .filter((item) => !item.category.startsWith("PRIMARY_"))
        .map((item, index) => ({
          mediaId: item.media.id,
          category: item.category,
          sortOrder: index,
          caption: item.caption || null,
        }));
      if (supporting.length > 12) throw new Error("Use no more than 12 supporting images.");
      const data = new FormData(event.currentTarget);
      const published = project?.status === "PUBLISHED";
      const payload = {
        title: data.get("title"),
        ...(published
          ? {}
          : {
              slug: data.get("slug"),
              primaryBeforeMediaId: before,
              primaryAfterMediaId: after,
              supportingMedia: supporting,
            }),
        serviceKey: data.get("serviceKey"),
        serviceAreaKey: data.get("serviceAreaKey"),
        summary: data.get("summary"),
        description: data.get("description"),
        completedAt: data.get("completedAt")
          ? new Date(String(data.get("completedAt"))).toISOString()
          : null,
        seoTitle: data.get("seoTitle") || null,
        seoDescription: data.get("seoDescription") || null,
        featured: data.get("featured") === "on",
        ...(project ? { version: project.version } : {}),
      };
      const saved = project
        ? await mutation(`before-after-projects/${project.id}`, "PATCH", payload)
        : await mutation("before-after-projects", "POST", payload);
      if (canDeleteMedia)
        for (const item of existing.filter((candidate) => candidate.removed))
          await mutation(`media/before-after/${item.media.id}`, "DELETE").catch(() => undefined);
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current.clear();
      setDirty(false);
      setFeedback("Draft saved.");
      window.location.href = `/before-after/${String(saved.id)}`;
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "The draft could not be saved.");
    }
  }
  async function lifecycle(action: "publish" | "unpublish" | "archive" | "delete") {
    if (!project) return;
    if (dirty) {
      setFailed(true);
      setFeedback("Save or discard unpublished changes before changing project status.");
      return;
    }
    if (
      !window.confirm(
        action === "delete"
          ? "Permanently delete this draft project record? Uploaded images remain managed until removed."
          : `${action[0]!.toUpperCase() + action.slice(1)} this project?`,
      )
    )
      return;
    try {
      await mutation(
        `before-after-projects/${project.id}${action === "delete" ? "" : `/${action}`}`,
        action === "delete" ? "DELETE" : "POST",
      );
      window.location.href = action === "delete" ? "/before-after" : `/before-after/${project.id}`;
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "The status change failed.");
    }
  }
  const activeExisting = existing.filter((item) => !item.removed);
  const beforePreview = activeExisting.find((item) => item.category === "PRIMARY_BEFORE");
  const afterPreview = activeExisting.find((item) => item.category === "PRIMARY_AFTER");
  const pendingBefore = pending.find((item) => item.category === "PRIMARY_BEFORE");
  const pendingAfter = pending.find((item) => item.category === "PRIMARY_AFTER");
  const beforeSrc = pendingBefore?.url || (beforePreview ? mediaSource(beforePreview.media) : "");
  const afterSrc = pendingAfter?.url || (afterPreview ? mediaSource(afterPreview.media) : "");
  return (
    <form className="grid gap-7" onChange={() => setDirty(true)} onSubmit={save}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {project ? "Edit before-and-after project" : "Create before-and-after project"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {project
              ? `${project.status} · Version ${project.version}`
              : "New projects begin as private drafts."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save draft</Button>
          {project && canPublish && project.status !== "PUBLISHED" ? (
            <Button onClick={() => void lifecycle("publish")} type="button" variant="secondary">
              Publish
            </Button>
          ) : null}
          {project && canPublish && project.status === "PUBLISHED" ? (
            <Button onClick={() => void lifecycle("unpublish")} type="button" variant="outline">
              Unpublish
            </Button>
          ) : null}
          {project && canArchive && project.status !== "ARCHIVED" ? (
            <Button onClick={() => void lifecycle("archive")} type="button" variant="outline">
              Archive
            </Button>
          ) : null}
          {project && canDelete && project.status === "DRAFT" ? (
            <Button onClick={() => void lifecycle("delete")} type="button" variant="destructive">
              Delete draft
            </Button>
          ) : null}
        </div>
      </div>
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <h3 className="text-xl font-semibold">Basic information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="project-title">Title</Label>
            <Input defaultValue={project?.title} id="project-title" name="title" required />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="project-slug">URL slug</Label>
            <Input
              defaultValue={project?.slug}
              disabled={project?.status === "PUBLISHED"}
              id="project-slug"
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
            <FormDescription>
              Lowercase letters, numbers, and hyphens. Unpublish before changing a published URL.
            </FormDescription>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="project-service">Service</Label>
            <Select
              defaultValue={project?.serviceKey ?? "window-cleaning"}
              id="project-service"
              name="serviceKey"
            >
              <option value="window-cleaning">Window Cleaning</option>
              <option value="pressure-washing">Pressure Washing</option>
              <option value="gutter-cleaning">Gutter Cleaning</option>
              <option value="moss-removal">Moss Removal</option>
              <option value="vent-cleaning">Vent Cleaning</option>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="project-area">Service area</Label>
            <Select
              defaultValue={project?.serviceAreaKey ?? "vancouver"}
              id="project-area"
              name="serviceAreaKey"
            >
              <option value="vancouver">Vancouver</option>
              <option value="richmond">Richmond</option>
              <option value="burnaby">Burnaby</option>
              <option value="surrey">Surrey</option>
              <option value="coquitlam">Coquitlam</option>
              <option value="north-vancouver">North Vancouver</option>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="project-completed">Completion date</Label>
            <Input
              defaultValue={project?.completedAt?.slice(0, 10)}
              id="project-completed"
              name="completedAt"
              type="date"
            />
          </FieldGroup>
          <Label className="flex min-h-11 items-center gap-2">
            <Checkbox defaultChecked={project?.featured} name="featured" />
            Feature this project when published
          </Label>
        </div>
        <FieldGroup>
          <Label htmlFor="project-summary">Summary</Label>
          <Textarea
            defaultValue={project?.summary}
            id="project-summary"
            maxLength={500}
            name="summary"
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            defaultValue={project?.description}
            id="project-description"
            maxLength={10000}
            name="description"
            required
          />
          <FormDescription>
            Plain text paragraphs only. Do not include customer contact details or exact residential
            addresses.
          </FormDescription>
        </FieldGroup>
      </section>
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div>
          <h3 className="text-xl font-semibold">Primary Before and After</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Both primary images and meaningful alt text are required before publication.
          </p>
        </div>
        {beforeSrc && afterSrc ? (
          <ImageComparison
            before={
              <img
                alt={pendingBefore?.altText || beforePreview?.media.altText || "Before preview"}
                className="size-full object-cover"
                src={beforeSrc}
              />
            }
            after={
              <img
                alt={pendingAfter?.altText || afterPreview?.media.altText || "After preview"}
                className="size-full object-cover"
                src={afterSrc}
              />
            }
          />
        ) : (
          <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
            Add and categorize a primary Before and primary After image to activate the protected
            comparison preview.
          </p>
        )}
      </section>
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div>
          <h3 className="text-xl font-semibold">Managed images</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            JPEG, PNG, or WebP; up to 10 MB each; 600 × 400 minimum; 12 supporting images maximum.
            Uploaded SVG is rejected.
          </p>
        </div>
        {canUpload && project?.status !== "PUBLISHED" ? (
          <FieldGroup>
            <Label htmlFor="project-files">Select one or more images</Label>
            <Input
              accept="image/jpeg,image/png,image/webp"
              id="project-files"
              multiple
              onChange={(event) => void selectFiles(event.currentTarget.files)}
              type="file"
            />
            <FormDescription>
              Selection previews remain local until Save draft. Invalid files stay visible and are
              not uploaded.
            </FormDescription>
          </FieldGroup>
        ) : (
          <p className="text-sm text-muted-foreground">
            {project?.status === "PUBLISHED"
              ? "Unpublish this project before changing its managed images."
              : "You do not have upload permission."}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeExisting.map((item, index) => (
            <MediaEditor
              altText={item.media.altText}
              canEdit={canUpdateMedia && project?.status !== "PUBLISHED"}
              category={item.category}
              caption={item.caption}
              index={index}
              key={item.media.id}
              label={item.media.originalFilename}
              move={(direction) => moveExisting(index, direction)}
              onAlt={(altText) =>
                setExisting((items) =>
                  items.map((candidate) =>
                    candidate.media.id === item.media.id
                      ? { ...candidate, media: { ...candidate.media, altText } }
                      : candidate,
                  ),
                )
              }
              onCaption={(caption) =>
                setExisting((items) =>
                  items.map((candidate) =>
                    candidate.media.id === item.media.id ? { ...candidate, caption } : candidate,
                  ),
                )
              }
              onCategory={(category) =>
                setExisting((items) =>
                  items.map((candidate) =>
                    candidate.media.id === item.media.id ? { ...candidate, category } : candidate,
                  ),
                )
              }
              onRemove={() => {
                setExisting((items) =>
                  items.map((candidate) =>
                    candidate.media.id === item.media.id
                      ? { ...candidate, removed: true }
                      : candidate,
                  ),
                );
                setDirty(true);
              }}
              preview={mediaSource(item.media)}
              total={activeExisting.length}
            />
          ))}
          {pending.map((item, index) => (
            <MediaEditor
              canEdit
              altText={item.altText}
              category={item.category}
              caption={item.caption}
              error={item.error}
              fileSize={item.file.size}
              index={index}
              key={item.id}
              label={item.file.name}
              move={(direction) => movePending(index, direction)}
              onAlt={(altText) =>
                setPending((items) =>
                  items.map((candidate) =>
                    candidate.id === item.id ? { ...candidate, altText } : candidate,
                  ),
                )
              }
              onCaption={(caption) =>
                setPending((items) =>
                  items.map((candidate) =>
                    candidate.id === item.id ? { ...candidate, caption } : candidate,
                  ),
                )
              }
              onCategory={(category) =>
                setPending((items) =>
                  items.map((candidate) =>
                    candidate.id === item.id ? { ...candidate, category } : candidate,
                  ),
                )
              }
              onRemove={() => removePending(item.id)}
              preview={item.url}
              status={item.status}
              total={pending.length}
            />
          ))}
        </div>
      </section>
      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <h3 className="text-xl font-semibold">SEO</h3>
        <FieldGroup>
          <Label htmlFor="project-seo-title">SEO title</Label>
          <Input
            defaultValue={project?.seoTitle ?? ""}
            id="project-seo-title"
            maxLength={70}
            name="seoTitle"
          />
          <FormDescription>Optional; the project title is the safe fallback.</FormDescription>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="project-seo-description">SEO description</Label>
          <Textarea
            defaultValue={project?.seoDescription ?? ""}
            id="project-seo-description"
            maxLength={170}
            name="seoDescription"
          />
          <FormDescription>Optional; the project summary is the safe fallback.</FormDescription>
        </FieldGroup>
      </section>
      <p
        aria-live="polite"
        className={
          failed ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-success"
        }
        role={failed ? "alert" : "status"}
      >
        {feedback}
      </p>
      {dirty ? (
        <p className="text-sm text-warning">
          Unpublished changes are present. Save before leaving or changing lifecycle state.
        </p>
      ) : null}
    </form>
  );
}

function MediaEditor({
  label,
  preview,
  category,
  caption,
  altText = "",
  index,
  total,
  fileSize,
  error,
  status,
  canEdit,
  onCategory,
  onAlt,
  onCaption,
  onRemove,
  move,
}: {
  readonly label: string;
  readonly preview: string;
  readonly category: Category;
  readonly caption: string;
  readonly altText?: string;
  readonly index: number;
  readonly total: number;
  readonly fileSize?: number;
  readonly error?: string;
  readonly status?: PendingItem["status"];
  readonly canEdit: boolean;
  readonly onCategory: (value: Category) => void;
  readonly onAlt: (value: string) => void;
  readonly onCaption: (value: string) => void;
  readonly onRemove: () => void;
  readonly move: (direction: -1 | 1) => void;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-border p-3">
      <img alt="" className="aspect-[4/3] w-full rounded-md object-cover" src={preview} />
      <p className="mt-3 truncate text-sm font-semibold" title={label}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground">
        Position {index + 1}
        {fileSize ? ` · ${formatBytes(fileSize)}` : ""}
        {status ? ` · ${status}` : ""}
      </p>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <FieldGroup className="mt-3">
        <Label htmlFor={`category-${label}-${index}`}>Image role</Label>
        <Select
          disabled={!canEdit}
          id={`category-${label}-${index}`}
          onChange={(event) => onCategory(event.currentTarget.value as Category)}
          value={category}
        >
          <option value="PRIMARY_BEFORE">Primary Before</option>
          <option value="PRIMARY_AFTER">Primary After</option>
          <option value="BEFORE">Supporting Before</option>
          <option value="AFTER">Supporting After</option>
          <option value="GALLERY">Gallery</option>
        </Select>
      </FieldGroup>
      <FieldGroup className="mt-3">
        <Label htmlFor={`alt-${label}-${index}`}>Alt text</Label>
        <Input
          disabled={!canEdit}
          id={`alt-${label}-${index}`}
          onChange={(event) => onAlt(event.currentTarget.value)}
          placeholder="Describe the visible result, without 'image of'"
          value={altText}
        />
      </FieldGroup>
      <FieldGroup className="mt-3">
        <Label htmlFor={`caption-${label}-${index}`}>Optional caption</Label>
        <Input
          disabled={!canEdit}
          id={`caption-${label}-${index}`}
          onChange={(event) => onCaption(event.currentTarget.value)}
          value={caption}
        />
      </FieldGroup>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-label={`Move ${label} up`}
          disabled={!canEdit || index === 0}
          onClick={() => move(-1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Move up
        </Button>
        <Button
          aria-label={`Move ${label} down`}
          disabled={!canEdit || index >= total - 1}
          onClick={() => move(1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Move down
        </Button>
        <Button
          aria-label={`Remove ${label}`}
          disabled={!canEdit}
          onClick={onRemove}
          size="sm"
          type="button"
          variant="destructive"
        >
          Remove
        </Button>
      </div>
    </article>
  );
}
