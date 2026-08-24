"use client";

/* eslint-disable @next/next/no-img-element -- previews include local object URLs and protected media routes */

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { StructuredTextDocument } from "@ctps/types";
import { ImageComparison } from "@ctps/ui/image-comparison";
import { useToast } from "@ctps/ui/toast";
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
import { ArrowLeft, CheckCircle2, Eye, ImageIcon, RotateCcw, Save } from "@ctps/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectRichTextEditor } from "./project-rich-text-editor";
import type { AdminMedia, AdminProject } from "@/lib/before-after-types";
import { legacyProjectText, projectBlocksText } from "../lib/project-rich-text";
import { projectSlugFromTitle } from "../lib/project-slug";

type Category =
  "PRIMARY_COVER" | "PRIMARY_BEFORE" | "PRIMARY_AFTER" | "BEFORE" | "AFTER" | "GALLERY";
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
class NotifiedProjectError extends Error {}
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
  const router = useRouter();
  const { toast } = useToast();
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
    ...(project?.coverMedia &&
    project.coverMedia.id !== project.primaryBeforeMedia?.id &&
    project.coverMedia.id !== project.primaryAfterMedia?.id
      ? [
          {
            media: project.coverMedia,
            category: "PRIMARY_COVER" as const,
            caption: project.coverMedia.caption ?? "",
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
  const [saving, setSaving] = useState(false);
  const [mediaErrors, setMediaErrors] = useState<{ before?: string; after?: string }>({});
  const [coverUsesAfter, setCoverUsesAfter] = useState(
    Boolean(project?.coverMedia && project.coverMedia.id === project.primaryAfterMedia?.id),
  );
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugOverridden, setSlugOverridden] = useState(Boolean(project));
  const [summaryContent, setSummaryContent] = useState<StructuredTextDocument>(
    project?.summaryContent ?? legacyProjectText(project?.summary ?? ""),
  );
  const [descriptionContent, setDescriptionContent] = useState<StructuredTextDocument>(
    project?.descriptionContent ?? legacyProjectText(project?.description ?? ""),
  );
  const formRef = useRef<HTMLFormElement>(null);
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
  async function selectFiles(files: FileList | null, category: Category = "GALLERY") {
    if (!files) return;
    const available = Math.max(
      0,
      14 - existing.filter((item) => !item.removed).length - pending.length,
    );
    const selected = [...files].slice(0, category.startsWith("PRIMARY_") ? 1 : available);
    if (category.startsWith("PRIMARY_")) {
      if (category === "PRIMARY_BEFORE")
        setMediaErrors((errors) => (errors.after ? { after: errors.after } : {}));
      if (category === "PRIMARY_AFTER")
        setMediaErrors((errors) => (errors.before ? { before: errors.before } : {}));
      setExisting((items) =>
        items.map((item) => (item.category === category ? { ...item, removed: true } : item)),
      );
      setPending((items) => {
        for (const item of items.filter((candidate) => candidate.category === category)) {
          URL.revokeObjectURL(item.url);
          urls.current.delete(item.url);
        }
        return items.filter((item) => item.category !== category);
      });
      if (category === "PRIMARY_COVER") setCoverUsesAfter(false);
    }
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
        category,
        altText: "",
        caption: "",
        error,
        status: "selected",
      });
    }
    if (!category.startsWith("PRIMARY_") && files.length > available)
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
      const message = result.message ?? `${item.file.name} could not be uploaded.`;
      toast({
        title: "Photo upload failed",
        description: `${item.category === "PRIMARY_AFTER" ? "The After photo" : item.category === "PRIMARY_BEFORE" ? "The Before photo" : "A project photo"} could not be uploaded. Try again before publishing.`,
        tone: "error",
      });
      throw new NotifiedProjectError(message);
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
    if (saving) return;
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || form !== formRef.current) {
      setFailed(true);
      setFeedback("The project form could not be identified. Reload and try again.");
      return;
    }
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const intent =
      submitter instanceof HTMLButtonElement && submitter.value === "PUBLISH"
        ? "PUBLISH"
        : "SAVE_DRAFT";
    const data = new FormData(form);
    const summary = projectBlocksText(summaryContent);
    const description = projectBlocksText(descriptionContent);
    setSaving(true);
    setFeedback(intent === "PUBLISH" ? "Publishing project…" : "Saving draft…");
    setFailed(false);
    setMediaErrors({});
    const invalid = pending.filter((item) => item.error && item.status !== "failed");
    if (invalid.length) {
      setFeedback("Remove or correct invalid selected images before saving.");
      setFailed(true);
      toast({
        title: "Photo upload needs attention",
        description: "Remove or correct invalid selected photos before continuing.",
        tone: "error",
      });
      setSaving(false);
      return;
    }
    const selected = [...existing.filter((item) => !item.removed), ...pending];
    if (
      selected.filter((item) => item.category === "PRIMARY_BEFORE").length > 1 ||
      selected.filter((item) => item.category === "PRIMARY_AFTER").length > 1
    ) {
      setFeedback("Choose only one Primary Before image and one Primary After image.");
      setFailed(true);
      toast({
        title: "Project media needs attention",
        description: "Choose only one primary Before photo and one primary After photo.",
        tone: "error",
      });
      setSaving(false);
      return;
    }
    const selectedBefore = selected.some((item) => item.category === "PRIMARY_BEFORE");
    const selectedAfter = selected.some((item) => item.category === "PRIMARY_AFTER");
    if (intent === "PUBLISH" && (!selectedBefore || !selectedAfter)) {
      setMediaErrors({
        ...(!selectedBefore ? { before: "Add at least one Before photo before publishing." } : {}),
        ...(!selectedAfter ? { after: "Add at least one After photo before publishing." } : {}),
      });
      setFailed(true);
      setFeedback("Project is not ready to publish.");
      toast({
        title: "Project isn't ready to publish",
        description:
          !selectedBefore && !selectedAfter
            ? "Add both a Before photo and an After photo before publishing."
            : !selectedBefore
              ? "A Before photo is required."
              : "An After photo is required.",
        tone: "error",
      });
      document.querySelector<HTMLElement>("#project-transformation")?.focus();
      setSaving(false);
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
      const dedicatedCover =
        all.find((item) => item.category === "PRIMARY_COVER")?.media.id ?? null;
      const cover = coverUsesAfter ? after : dedicatedCover;
      const supporting = all
        .filter((item) => !item.category.startsWith("PRIMARY_"))
        .map((item, index) => ({
          mediaId: item.media.id,
          category: item.category,
          sortOrder: index,
          caption: item.caption || null,
        }));
      if (supporting.length > 12) throw new Error("Use no more than 12 supporting images.");
      const published = project?.status === "PUBLISHED";
      const payload = {
        title,
        ...(published
          ? {}
          : {
              slug,
              primaryBeforeMediaId: before,
              primaryAfterMediaId: after,
              coverMediaId: cover,
              supportingMedia: supporting,
            }),
        serviceKey: data.get("serviceKey"),
        serviceAreaKey: data.get("serviceAreaKey"),
        summary,
        description,
        summaryContent,
        descriptionContent,
        completedAt: data.get("completedAt")
          ? new Date(String(data.get("completedAt"))).toISOString()
          : null,
        seoTitle: data.get("seoTitle") || null,
        seoDescription: data.get("seoDescription") || null,
        featured: data.get("featured") === "on",
        ...(!project ? { intent } : {}),
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
      setFeedback("");
      const savedProject = saved as unknown as { id: string; slug: string; status: string };
      toast(
        intent === "PUBLISH"
          ? {
              title: "Project published",
              description: "The project is now available on the public website.",
              tone: "success",
              action: {
                label: "View project",
                onClick: () => window.open(`/before-after/${savedProject.slug}`, "_blank"),
              },
            }
          : {
              title: project ? "Changes saved" : "Draft saved",
              description: project
                ? "Your project changes have been saved."
                : "Your project has been saved and can be completed later.",
              tone: "success",
            },
      );
      router.replace(`/before-after/${savedProject.id}`);
      router.refresh();
    } catch (error) {
      setFailed(true);
      const message = error instanceof Error ? error.message : "The project could not be saved.";
      setFeedback(message);
      if (!(error instanceof NotifiedProjectError))
        toast({
          title: intent === "PUBLISH" ? "Publish failed" : "Save failed",
          description: message,
          tone: "error",
        });
    } finally {
      setSaving(false);
    }
  }
  async function lifecycle(action: "publish" | "unpublish" | "archive" | "delete") {
    if (!project) return;
    if (dirty) {
      setFailed(true);
      setFeedback("Save or discard unpublished changes before changing project status.");
      toast({
        title: "Unsaved changes",
        description: "Save or discard your changes before changing the project status.",
        tone: "warning",
      });
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
      const updated = (await mutation(
        `before-after-projects/${project.id}${action === "delete" ? "" : `/${action}`}`,
        action === "delete" ? "DELETE" : "POST",
      )) as { slug?: string };
      if (action !== "delete")
        toast({
          title:
            action === "publish"
              ? "Project published"
              : action === "unpublish"
                ? "Project unpublished"
                : "Project archived",
          description:
            action === "publish"
              ? "The project is now available on the public website."
              : action === "unpublish"
                ? "The project is no longer visible on the public website."
                : "The project has been archived.",
          tone: "success",
          ...(action === "publish" && updated.slug
            ? {
                action: {
                  label: "View project",
                  onClick: () => window.open(`/before-after/${updated.slug}`, "_blank"),
                },
              }
            : {}),
        });
      router.replace(action === "delete" ? "/before-after" : `/before-after/${project.id}`);
      router.refresh();
    } catch (error) {
      setFailed(true);
      const message = error instanceof Error ? error.message : "The status change failed.";
      setFeedback(message);
      toast({ title: "Project action failed", description: message, tone: "error" });
    }
  }
  const activeExisting = existing.filter((item) => !item.removed);
  const coverPreview = activeExisting.find((item) => item.category === "PRIMARY_COVER");
  const beforePreview = activeExisting.find((item) => item.category === "PRIMARY_BEFORE");
  const afterPreview = activeExisting.find((item) => item.category === "PRIMARY_AFTER");
  const pendingCover = pending.find((item) => item.category === "PRIMARY_COVER");
  const pendingBefore = pending.find((item) => item.category === "PRIMARY_BEFORE");
  const pendingAfter = pending.find((item) => item.category === "PRIMARY_AFTER");
  const beforeSrc = pendingBefore?.url || (beforePreview ? mediaSource(beforePreview.media) : "");
  const afterSrc = pendingAfter?.url || (afterPreview ? mediaSource(afterPreview.media) : "");
  const coverSrc = coverUsesAfter
    ? afterSrc
    : pendingCover?.url || (coverPreview ? mediaSource(coverPreview.media) : "");
  function removeRole(category: "PRIMARY_COVER" | "PRIMARY_BEFORE" | "PRIMARY_AFTER") {
    setExisting((items) =>
      items.map((item) => (item.category === category ? { ...item, removed: true } : item)),
    );
    setPending((items) => {
      for (const item of items.filter((candidate) => candidate.category === category)) {
        URL.revokeObjectURL(item.url);
        urls.current.delete(item.url);
      }
      return items.filter((item) => item.category !== category);
    });
    if (category === "PRIMARY_COVER") setCoverUsesAfter(false);
    setDirty(true);
  }
  return (
    <form
      className="project-editor-shell"
      id="before-after-project-form"
      onChange={() => setDirty(true)}
      onSubmit={save}
      ref={formRef}
    >
      <div className="project-command-bar">
        <div>
          <Link className="blog-back-link" href="/before-after">
            <ArrowLeft aria-hidden="true" /> Projects
          </Link>
          <h2 className="sr-only">{project ? "Edit Project" : "New Project"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {project ? `${project.status} · Version ${project.version}` : "New Project · Unsaved"}
          </p>
        </div>
        <div className="blog-document-state">
          <span className="blog-status-badge">{project?.status ?? "DRAFT"}</span>
          <span className={`blog-save-state${failed ? " is-failed" : dirty ? " is-unsaved" : ""}`}>
            {saving ? (
              "Savingâ€¦"
            ) : failed ? (
              "Save failed"
            ) : dirty ? (
              "Unsaved"
            ) : (
              <>
                <CheckCircle2 aria-hidden="true" /> Saved
              </>
            )}
          </span>
        </div>
        <div className="blog-publishing-actions">
          {project?.status === "PUBLISHED" ? (
            <Link
              className="blog-command-link"
              href={`/before-after/${project.slug}`}
              target="_blank"
            >
              <Eye aria-hidden="true" /> Public page
            </Link>
          ) : null}
          <Button
            disabled={saving}
            name="intent"
            type="submit"
            value="SAVE_DRAFT"
            variant={project?.status === "PUBLISHED" ? "primary" : "outline"}
          >
            <Save aria-hidden="true" />{" "}
            {saving ? "Saving…" : project?.status === "PUBLISHED" ? "Save changes" : "Save Draft"}
          </Button>
          {!project && canPublish ? (
            <Button disabled={saving} name="intent" type="submit" value="PUBLISH">
              Publish Now
            </Button>
          ) : null}
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
      <ProjectRichTextEditor
        description={descriptionContent}
        onDescriptionChange={(value) => {
          setDescriptionContent(value);
          setDirty(true);
        }}
        onSummaryChange={(value) => {
          setSummaryContent(value);
          setDirty(true);
        }}
        summary={summaryContent}
      />
      <div className="project-editor-workspace">
        <div className="project-editor-main-column">
          <section className="project-editor-section">
            <div className="project-section-heading">
              <div>
                <p className="eyebrow">Project identity</p>
                <h3>Project details</h3>
                <p>Define the public title and stable URL before publishing.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup className="md:col-span-2">
                <Label htmlFor="project-title">Title</Label>
                <Input
                  id="project-title"
                  name="title"
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setTitle(value);
                    if (!slugOverridden) setSlug(projectSlugFromTitle(value));
                  }}
                  required
                  value={title}
                />
              </FieldGroup>
              <FieldGroup className="md:col-span-2">
                <Label htmlFor="project-slug">URL slug</Label>
                <div className="project-slug-row">
                  <span aria-hidden="true">/before-after/</span>
                  <Input
                    disabled={project?.status === "PUBLISHED"}
                    id="project-slug"
                    name="slug"
                    onChange={(event) => {
                      setSlug(event.currentTarget.value);
                      setSlugOverridden(true);
                    }}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    required
                    value={slug}
                  />
                  <Button
                    aria-label="Regenerate slug from title"
                    disabled={project?.status === "PUBLISHED"}
                    onClick={() => {
                      setSlug(projectSlugFromTitle(title));
                      setSlugOverridden(false);
                      setDirty(true);
                    }}
                    size="icon"
                    title="Regenerate from title"
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw aria-hidden="true" />
                  </Button>
                </div>
                <FormDescription>
                  Lowercase letters, numbers, and hyphens. Unpublish before changing a published
                  URL.
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
            <p className="text-xs text-muted-foreground md:col-span-2">
              Summary: {projectBlocksText(summaryContent).length}/500 characters Â· Description:{" "}
              {projectBlocksText(descriptionContent).length}/10,000 characters. Do not include
              customer contact details or exact residential addresses.
            </p>
          </section>
          <section className="project-editor-section" id="project-transformation" tabIndex={-1}>
            <div>
              <p className="eyebrow">Transformation</p>
              <h3 className="text-xl font-semibold">Before and After photos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Both photos and meaningful alt text are required for publication. Incomplete Drafts
                can still be saved.
              </p>
            </div>
            <div className="project-transformation-grid">
              <TransformationPhotoPanel
                canEdit={canUpload && project?.status !== "PUBLISHED"}
                description="Upload a photo showing the property before the work was completed."
                {...(mediaErrors.before ? { error: mediaErrors.before } : {})}
                inputId="project-before-photo"
                label="Before photo"
                onFile={(files) => void selectFiles(files, "PRIMARY_BEFORE")}
                onRemove={() => removeRole("PRIMARY_BEFORE")}
                preview={beforeSrc}
                status={pendingBefore?.status ?? (beforeSrc ? "ready" : "missing")}
              />
              <TransformationPhotoPanel
                canEdit={canUpload && project?.status !== "PUBLISHED"}
                description="Upload a photo showing the result after the work was completed."
                {...(mediaErrors.after ? { error: mediaErrors.after } : {})}
                inputId="project-after-photo"
                label="After photo"
                onFile={(files) => void selectFiles(files, "PRIMARY_AFTER")}
                onRemove={() => removeRole("PRIMARY_AFTER")}
                preview={afterSrc}
                status={pendingAfter?.status ?? (afterSrc ? "ready" : "missing")}
              />
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
                Add a Before photo and an After photo to activate the protected comparison preview.
              </p>
            )}
          </section>
          <section className="project-editor-section">
            <div>
              <p className="eyebrow">Listing image</p>
              <h3 className="text-xl font-semibold">Cover / Featured image</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Recommended for cards, featured work, and social previews. If omitted, the primary
                After photo is the deterministic public fallback.
              </p>
            </div>
            <TransformationPhotoPanel
              canEdit={canUpload && project?.status !== "PUBLISHED"}
              description="Upload a dedicated cover or reuse the primary After photo without duplicating the file."
              inputId="project-cover-photo"
              label="Cover image"
              onFile={(files) => void selectFiles(files, "PRIMARY_COVER")}
              onRemove={() => removeRole("PRIMARY_COVER")}
              preview={coverSrc}
              status={pendingCover?.status ?? (coverSrc ? "ready" : "missing")}
            />
            <Button
              disabled={!afterSrc || project?.status === "PUBLISHED"}
              onClick={() => {
                removeRole("PRIMARY_COVER");
                setCoverUsesAfter(true);
                setDirty(true);
              }}
              type="button"
              variant="outline"
            >
              <ImageIcon aria-hidden="true" /> Use After photo as cover
            </Button>
          </section>
          <section className="project-editor-section">
            <div>
              <h3 className="text-xl font-semibold">Project media details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                JPEG, PNG, or WebP; up to 10 MB each; 600 × 400 minimum; 12 supporting images
                maximum. Uploaded SVG is rejected.
              </p>
            </div>
            {canUpload && project?.status !== "PUBLISHED" ? (
              <FieldGroup>
                <Label htmlFor="project-files">Add supporting gallery photos</Label>
                <Input
                  accept="image/jpeg,image/png,image/webp"
                  id="project-files"
                  multiple
                  onChange={(event) => void selectFiles(event.currentTarget.files)}
                  type="file"
                />
                <FormDescription>
                  Selection previews remain local until Save Draft. Invalid files stay visible and
                  are not uploaded.
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
                        candidate.media.id === item.media.id
                          ? { ...candidate, caption }
                          : candidate,
                      ),
                    )
                  }
                  onCategory={(category) =>
                    setExisting((items) =>
                      items.map((candidate) =>
                        candidate.media.id === item.media.id
                          ? { ...candidate, category }
                          : candidate,
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
        </div>
        <aside className="project-settings-sidebar">
          <section className="project-editor-section">
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
          <section className="project-editor-section">
            <div className="project-section-heading">
              <div>
                <p className="eyebrow">Readiness</p>
                <h3>Publication checks</h3>
              </div>
            </div>
            <ul className="project-readiness-list">
              <li data-ready={Boolean(title && slug)}>Title and slug</li>
              <li data-ready={Boolean(projectBlocksText(summaryContent))}>Summary</li>
              <li data-ready={Boolean(projectBlocksText(descriptionContent))}>Description</li>
              <li data-ready={Boolean(beforeSrc)}>Before photo</li>
              <li data-ready={Boolean(afterSrc)}>After photo</li>
              <li data-ready={Boolean(coverSrc)}>Cover image (recommended)</li>
            </ul>
          </section>
        </aside>
      </div>
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

function TransformationPhotoPanel({
  canEdit,
  description,
  error,
  inputId,
  label,
  onFile,
  onRemove,
  preview,
  status,
}: {
  readonly canEdit: boolean;
  readonly description: string;
  readonly error?: string;
  readonly inputId: string;
  readonly label: string;
  readonly onFile: (files: FileList | null) => void;
  readonly onRemove: () => void;
  readonly preview: string;
  readonly status: "missing" | "selected" | "uploading" | "failed" | "ready";
}) {
  const stateLabel =
    status === "uploading"
      ? "Uploading"
      : status === "failed"
        ? "Upload failed"
        : status === "missing"
          ? "Missing"
          : "Ready";
  return (
    <article className="project-transformation-panel" data-state={status}>
      <div className="project-transformation-heading">
        <h4>{label}</h4>
        <span aria-label={`${label}: ${stateLabel}`}>{stateLabel}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="project-transformation-preview">
        {preview ? (
          <img alt="" className="size-full object-cover" src={preview} />
        ) : (
          <div>
            <ImageIcon aria-hidden="true" />
            <span>No photo selected</span>
          </div>
        )}
      </div>
      {error ? (
        <p className="text-sm font-semibold text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Label className="project-photo-upload" htmlFor={inputId}>
            {preview ? "Replace" : "Upload"} {label}
          </Label>
          <Input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id={inputId}
            onChange={(event) => onFile(event.currentTarget.files)}
            type="file"
          />
          {preview ? (
            <Button onClick={onRemove} type="button" variant="outline">
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
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
          <option value="PRIMARY_COVER">Cover / Featured</option>
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
