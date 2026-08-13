"use client";

/* eslint-disable @next/next/no-img-element -- private managed media and local object URLs */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Input, Label, Select, Textarea } from "@ctps/ui/primitives";
import { ArrowLeft, Check, Clock3, Eye, ImageIcon, Save, Send, X } from "@ctps/ui/icons";
import Link from "next/link";

import { BlogRichTextEditor } from "./blog-rich-text-editor";
import { blogBlocksText } from "../lib/blog-editor-content";
import type { BlogBlock, BlogMedia, BlogPostAdmin, BlogTaxonomy } from "../lib/blog-types";

type SaveState = "saved" | "unsaved" | "saving" | "failed";
type InsertImage = (item: BlogMedia, layout: "standard" | "wide" | "full") => void;
type Revision = {
  id: string;
  revisionNumber: number;
  title: string;
  excerpt: string;
  statusSnapshot: string;
  createdAt: string;
  actor: { displayName: string };
};

const mediaUrl = (id: string, variant = "thumbnail") => `/api/blog-media/${id}/${variant}`;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export function BlogPostEditor({
  post,
  categories,
  tags,
  libraryMedia = [],
  revisions = [],
  canPublish,
  canSchedule,
  canArchive,
  canDelete,
  canUpload,
  canUpdateMedia,
  canRestoreRevision = false,
}: {
  readonly post?: BlogPostAdmin;
  readonly categories: readonly BlogTaxonomy[];
  readonly tags: readonly BlogTaxonomy[];
  readonly libraryMedia?: readonly BlogMedia[];
  readonly revisions?: readonly Revision[];
  readonly canPublish: boolean;
  readonly canSchedule: boolean;
  readonly canArchive: boolean;
  readonly canDelete: boolean;
  readonly canUpload: boolean;
  readonly canUpdateMedia: boolean;
  readonly canRestoreRevision?: boolean;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [blocks, setBlocks] = useState<BlogBlock[]>(post?.content ?? []);
  const [media, setMedia] = useState<BlogMedia[]>(() => {
    const unique = new Map(libraryMedia.map((item) => [item.id, item]));
    for (const item of post?.media ?? []) unique.set(item.media.id, item.media);
    if (post?.featuredMedia) unique.set(post.featuredMedia.id, post.featuredMedia);
    return [...unique.values()];
  });
  const [featuredMediaId, setFeaturedMediaId] = useState(post?.featuredMediaId ?? "");
  const [selectedCategories, setSelectedCategories] = useState(
    post?.categories.map(({ id }) => id) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState(post?.tags.map(({ id }) => id) ?? []);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [version, setVersion] = useState(post?.version ?? 1);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<"insert" | "replace" | "featured">("insert");
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [imageLayout, setImageLayout] = useState<"standard" | "wide" | "full">("standard");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [scheduleMinimum, setScheduleMinimum] = useState("");
  const insertImage = useRef<InsertImage | null>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const mediaDialog = useRef<HTMLDialogElement>(null);
  const scheduleDialog = useRef<HTMLDialogElement>(null);
  const wordCount = useMemo(
    () => blogBlocksText(blocks).split(/\s+/).filter(Boolean).length,
    [blocks],
  );
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));
  const dirty = saveState === "unsaved" || saveState === "failed";

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    const dialog = settingsDialog.current;
    if (settingsOpen) dialog?.showModal();
    else if (dialog?.open) dialog.close();
  }, [settingsOpen]);
  useEffect(() => {
    const dialog = mediaDialog.current;
    if (mediaOpen) dialog?.showModal();
    else if (dialog?.open) dialog.close();
  }, [mediaOpen]);
  useEffect(() => {
    const dialog = scheduleDialog.current;
    if (scheduleOpen) dialog?.showModal();
    else if (dialog?.open) dialog.close();
  }, [scheduleOpen]);

  const markDirty = () => setSaveState((current) => (current === "saving" ? current : "unsaved"));
  const referencedMediaIds = useMemo(
    () => [
      ...new Set([
        ...(featuredMediaId ? [featuredMediaId] : []),
        ...blocks.flatMap((block) =>
          block.type === "image" || block.type === "managedImage" ? [block.mediaId] : [],
        ),
      ]),
    ],
    [blocks, featuredMediaId],
  );

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData();
    [...files].slice(0, 10).forEach((file) => body.append("files", file));
    setFeedback("Uploading and processing Blog imagesâ€¦");
    const response = await fetch("/api/blog-media", { method: "POST", body });
    const result = (await response.json().catch(() => ({}))) as {
      items?: BlogMedia[];
      message?: string;
    };
    if (!response.ok || !result.items) {
      setFailed(true);
      setFeedback(result.message ?? "The selected images could not be uploaded.");
      return;
    }
    setMedia((items) => [...result.items!, ...items]);
    setSelectedMediaId(result.items[0]?.id ?? "");
    setFailed(false);
    setFeedback(`${result.items.length} Blog image(s) uploaded privately.`);
  }

  async function saveMediaDetails(item: BlogMedia) {
    if (!canUpdateMedia) return;
    const response = await fetch(`/api/admin/blog/media/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ altText: item.altText, caption: item.caption }),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setFailed(true);
      setFeedback(result.message ?? "Image details could not be saved.");
      return false;
    }
    setFeedback("Image details saved.");
    setFailed(false);
    return true;
  }

  async function save() {
    setSaveState("saving");
    setFeedback("Saving Draftâ€¦");
    setFailed(false);
    const payload = {
      title,
      slug,
      excerpt,
      content: blocks,
      featuredMediaId: featuredMediaId || null,
      media: referencedMediaIds.map((mediaId, sortOrder) => ({ mediaId, sortOrder })),
      categoryIds: selectedCategories,
      tagIds: selectedTags,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      ...(post ? { version } : {}),
    };
    try {
      const response = await fetch(
        post ? `/api/admin/blog/posts/${post.id}` : "/api/admin/blog/posts",
        {
          method: post ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json().catch(() => ({}))) as BlogPostAdmin & {
        message?: string;
      };
      if (!response.ok) throw new Error(result.message ?? "The post could not be saved.");
      if (!post) {
        window.location.assign(`/blog/posts/${result.id}`);
        return;
      }
      setVersion(result.version);
      setSaveState("saved");
      setFeedback("Draft saved. A new revision was created.");
    } catch (error) {
      setSaveState("failed");
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "The post could not be saved.");
    }
  }

  async function lifecycle(action: string, schedule?: string) {
    if (!post || dirty || saveState === "saving") return;
    if (["publish", "unpublish", "archive", "delete"].includes(action)) {
      if (!confirm(`Confirm ${action} for this post?`)) return;
    }
    const response = await fetch(
      `/api/admin/blog/posts/${post.id}${action === "delete" ? "" : `/${action}`}`,
      action === "delete"
        ? { method: "DELETE", headers: { "content-type": "application/json" } }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(
              action === "schedule" ? { version, scheduledFor: schedule } : { version },
            ),
          },
    );
    const result = (await response.json().catch(() => ({}))) as BlogPostAdmin & {
      message?: string;
    };
    if (!response.ok) {
      setFailed(true);
      setFeedback(result.message ?? `The ${action} action failed.`);
      return;
    }
    if (action === "delete") window.location.assign("/blog/posts");
    else window.location.reload();
  }

  async function restoreRevision(revisionId: string) {
    if (!post || dirty || !confirm("Restore this revision into the current Draft?")) return;
    const response = await fetch(
      `/api/admin/blog/posts/${post.id}/revisions/${revisionId}/restore`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version }),
      },
    );
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setFailed(true);
      setFeedback(result.message ?? "The revision could not be restored.");
      return;
    }
    window.location.reload();
  }

  function openImagePicker(mode: "insert" | "replace" | "featured", insert?: InsertImage) {
    insertImage.current = insert ?? null;
    setMediaMode(mode);
    setSelectedMediaId(mode === "featured" ? featuredMediaId : "");
    setMediaOpen(true);
  }

  const selectedMedia = media.find(({ id }) => id === selectedMediaId);
  const statusLabel = post?.status.replaceAll("_", " ") ?? "NEW DRAFT";
  const stateLabel =
    saveState === "saving"
      ? "Savingâ€¦"
      : saveState === "unsaved"
        ? "Unsaved changes"
        : saveState === "failed"
          ? "Save failed"
          : "Saved";

  return (
    <div className="blog-editor-shell">
      <div className="blog-publishing-bar">
        <Link
          className="blog-back-link"
          href="/blog/posts"
          onClick={(event) => {
            if (dirty && !confirm("Leave this post and discard unsaved changes?"))
              event.preventDefault();
          }}
        >
          <ArrowLeft aria-hidden="true" /> Posts
        </Link>
        <div className="blog-document-state">
          <span className="blog-status-badge">{statusLabel}</span>
          <span aria-live="polite" className={`blog-save-state is-${saveState}`}>
            {saveState === "saved" ? <Check aria-hidden="true" /> : null}
            {stateLabel}
          </span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>{readingTime} min read</span>
        </div>
        <div className="blog-publishing-actions">
          <Button
            className="blog-settings-trigger"
            onClick={() => setSettingsOpen(true)}
            type="button"
            variant="outline"
          >
            Settings
          </Button>
          {post ? (
            <Link
              className="blog-command-link"
              href={`/blog/posts/${post.id}/preview`}
              target="_blank"
            >
              <Eye aria-hidden="true" /> Preview
            </Link>
          ) : null}
          <Button
            disabled={saveState === "saving"}
            onClick={() => void save()}
            type="button"
            variant="outline"
          >
            <Save aria-hidden="true" />{" "}
            {post?.status === "PUBLISHED" ? "Save update" : "Save Draft"}
          </Button>
          {post && canSchedule && ["DRAFT", "IN_REVIEW", "SCHEDULED"].includes(post.status) ? (
            <Button
              disabled={dirty}
              onClick={() => {
                setScheduleMinimum(new Date(Date.now() + 60_000).toISOString().slice(0, 16));
                setScheduleOpen(true);
              }}
              type="button"
              variant="outline"
            >
              <Clock3 aria-hidden="true" /> Schedule
            </Button>
          ) : null}
          {post?.status === "DRAFT" ? (
            <Button
              disabled={dirty}
              onClick={() => void lifecycle("submit-review")}
              type="button"
              variant="outline"
            >
              Submit for review
            </Button>
          ) : null}
          {post && canPublish && post.status !== "PUBLISHED" ? (
            <Button disabled={dirty} onClick={() => void lifecycle("publish")} type="button">
              <Send aria-hidden="true" /> Publish
            </Button>
          ) : null}
          {post && canPublish && post.status === "PUBLISHED" ? (
            <Button
              disabled={dirty}
              onClick={() => void lifecycle("unpublish")}
              type="button"
              variant="outline"
            >
              Unpublish
            </Button>
          ) : null}
        </div>
      </div>

      <div className="blog-editor-workspace">
        <main className="blog-writing-workspace">
          <div className="blog-title-fields">
            <Label className="sr-only" htmlFor="blog-title">
              Article title
            </Label>
            <Textarea
              aria-describedby="blog-title-guidance"
              className="blog-title-input"
              id="blog-title"
              maxLength={180}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
                markDirty();
              }}
              placeholder="Article title"
              required
              rows={1}
              value={title}
            />
            <span className="sr-only" id="blog-title-guidance">
              The article title becomes the public H1.
            </span>
            <Label className="sr-only" htmlFor="blog-excerpt">
              Excerpt
            </Label>
            <Textarea
              aria-describedby="blog-excerpt-count"
              className="blog-excerpt-input"
              id="blog-excerpt"
              maxLength={500}
              onChange={(event) => {
                setExcerpt(event.target.value);
                markDirty();
              }}
              placeholder="Briefly summarize what readers will learn."
              rows={3}
              value={excerpt}
            />
            <span className="blog-character-count" id="blog-excerpt-count">
              {excerpt.length}/500 characters
            </span>
          </div>
          <BlogRichTextEditor
            blocks={post?.content ?? []}
            media={media}
            onChange={(next) => {
              setBlocks(next);
              markDirty();
            }}
            onImageRequest={(insert, editing) =>
              openImagePicker(editing ? "replace" : "insert", insert)
            }
          />
        </main>
        <aside className="blog-settings-sidebar">
          <SettingsPanel
            prefix="desktop"
            {...{
              post,
              categories,
              tags,
              slug,
              selectedCategories,
              selectedTags,
              featuredMediaId,
              media,
              seoTitle,
              seoDescription,
              canArchive,
              canDelete,
            }}
            onArchive={() => void lifecycle("archive")}
            onDelete={() => void lifecycle("delete")}
            onDirty={markDirty}
            onFeatured={() => openImagePicker("featured")}
            onFeaturedRemove={() => {
              setFeaturedMediaId("");
              markDirty();
            }}
            onSlug={(value) => {
              setSlug(value);
              setSlugTouched(true);
              markDirty();
            }}
            onCategories={(ids) => {
              setSelectedCategories(ids);
              markDirty();
            }}
            onTags={(ids) => {
              setSelectedTags(ids);
              markDirty();
            }}
            onSeoTitle={(value) => {
              setSeoTitle(value);
              markDirty();
            }}
            onSeoDescription={(value) => {
              setSeoDescription(value);
              markDirty();
            }}
          />
        </aside>
      </div>

      {revisions.length ? (
        <section className="blog-revisions-panel">
          <h2>Revision history</h2>
          <p>Saving creates immutable history. Restoring creates a new Draft revision.</p>
          <ol>
            {revisions.map((revision) => (
              <li key={revision.id}>
                <div>
                  <strong>Revision {revision.revisionNumber}</strong>
                  <span>
                    {revision.title} Â· {revision.statusSnapshot}
                  </span>
                </div>
                <span>
                  {revision.actor.displayName} Â·{" "}
                  {new Intl.DateTimeFormat("en-CA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(revision.createdAt))}
                </span>
                {canRestoreRevision ? (
                  <Button
                    disabled={dirty}
                    onClick={() => void restoreRevision(revision.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Restore
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p
        aria-live="polite"
        className={failed ? "blog-editor-feedback is-error" : "blog-editor-feedback"}
        role={failed ? "alert" : "status"}
      >
        {feedback}
      </p>

      <dialog
        className="blog-settings-dialog"
        onClose={() => setSettingsOpen(false)}
        ref={settingsDialog}
      >
        <header>
          <div>
            <p className="eyebrow">Article settings</p>
            <h2>Publishing details</h2>
          </div>
          <button aria-label="Close settings" onClick={() => setSettingsOpen(false)} type="button">
            <X aria-hidden="true" />
          </button>
        </header>
        <SettingsPanel
          prefix="mobile"
          {...{
            post,
            categories,
            tags,
            slug,
            selectedCategories,
            selectedTags,
            featuredMediaId,
            media,
            seoTitle,
            seoDescription,
            canArchive,
            canDelete,
          }}
          onArchive={() => void lifecycle("archive")}
          onDelete={() => void lifecycle("delete")}
          onDirty={markDirty}
          onFeatured={() => {
            setSettingsOpen(false);
            openImagePicker("featured");
          }}
          onFeaturedRemove={() => {
            setFeaturedMediaId("");
            markDirty();
          }}
          onSlug={(value) => {
            setSlug(value);
            setSlugTouched(true);
            markDirty();
          }}
          onCategories={(ids) => {
            setSelectedCategories(ids);
            markDirty();
          }}
          onTags={(ids) => {
            setSelectedTags(ids);
            markDirty();
          }}
          onSeoTitle={(value) => {
            setSeoTitle(value);
            markDirty();
          }}
          onSeoDescription={(value) => {
            setSeoDescription(value);
            markDirty();
          }}
        />
      </dialog>

      <dialog className="blog-media-dialog" onClose={() => setMediaOpen(false)} ref={mediaDialog}>
        <header>
          <div>
            <p className="eyebrow">Blog media</p>
            <h2>
              {mediaMode === "featured"
                ? "Choose featured image"
                : mediaMode === "replace"
                  ? "Replace article image"
                  : "Insert article image"}
            </h2>
            <p>Blog media remains separate from customer, job, portfolio, and marketing assets.</p>
          </div>
          <button aria-label="Close image picker" onClick={() => setMediaOpen(false)} type="button">
            <X aria-hidden="true" />
          </button>
        </header>
        {canUpload ? (
          <label className="blog-media-upload">
            <ImageIcon aria-hidden="true" />
            <span>Upload New Blog Image</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => void upload(event.currentTarget.files)}
              type="file"
            />
          </label>
        ) : null}
        <div className="blog-media-dialog-layout">
          <div>
            <h3>Choose Existing Blog Media</h3>
            {media.length ? (
              <div className="blog-media-grid">
                {media.map((item) => (
                  <button
                    aria-pressed={selectedMediaId === item.id}
                    className={selectedMediaId === item.id ? "is-selected" : ""}
                    key={item.id}
                    onClick={() => setSelectedMediaId(item.id)}
                    type="button"
                  >
                    <img alt="" src={mediaUrl(item.id)} />
                    <strong>{item.originalFilename}</strong>
                    <span>
                      {item.visibility === "PRIVATE" ? "Private Draft media" : "Published media"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="blog-media-empty">No eligible Blog images yet.</p>
            )}
          </div>
          <aside>
            {selectedMedia ? (
              <>
                <img alt="" src={mediaUrl(selectedMedia.id, "article-standard")} />
                <Label htmlFor="selected-blog-alt">Alt text</Label>
                <Input
                  id="selected-blog-alt"
                  onChange={(event) =>
                    setMedia((items) =>
                      items.map((item) =>
                        item.id === selectedMedia.id
                          ? { ...item, altText: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Describe the image for readers who cannot see it."
                  value={selectedMedia.altText}
                />
                <Label htmlFor="selected-blog-caption">Caption (optional)</Label>
                <Textarea
                  id="selected-blog-caption"
                  maxLength={500}
                  onChange={(event) =>
                    setMedia((items) =>
                      items.map((item) =>
                        item.id === selectedMedia.id
                          ? { ...item, caption: event.target.value }
                          : item,
                      ),
                    )
                  }
                  value={selectedMedia.caption ?? ""}
                />
                {mediaMode !== "featured" ? (
                  <>
                    <Label htmlFor="blog-image-layout">Layout</Label>
                    <Select
                      id="blog-image-layout"
                      onChange={(event) => setImageLayout(event.target.value as typeof imageLayout)}
                      value={imageLayout}
                    >
                      <option value="standard">Standard</option>
                      <option value="wide">Wide</option>
                      <option value="full">Full reading width</option>
                    </Select>
                  </>
                ) : null}
                <Button
                  disabled={!canUpdateMedia}
                  onClick={() => void saveMediaDetails(selectedMedia)}
                  type="button"
                  variant="outline"
                >
                  Save image details
                </Button>
              </>
            ) : (
              <p>Select an image to review its accessibility details.</p>
            )}
          </aside>
        </div>
        <footer>
          <Button onClick={() => setMediaOpen(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!selectedMedia}
            onClick={() => {
              if (!selectedMedia) return;
              if (mediaMode === "featured") {
                setFeaturedMediaId(selectedMedia.id);
                markDirty();
              } else insertImage.current?.(selectedMedia, imageLayout);
              setMediaOpen(false);
            }}
            type="button"
          >
            {mediaMode === "featured"
              ? "Use featured image"
              : mediaMode === "replace"
                ? "Replace image"
                : "Insert image"}
          </Button>
        </footer>
      </dialog>

      <dialog
        className="blog-editor-dialog"
        onClose={() => setScheduleOpen(false)}
        ref={scheduleDialog}
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            const date = new Date(scheduledFor);
            if (!scheduledFor || Number.isNaN(date.valueOf())) return;
            setScheduleOpen(false);
            void lifecycle("schedule", date.toISOString());
          }}
        >
          <h2>Schedule publication</h2>
          <p>
            Choose a future time. The browser timezone is{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone}; the API stores the instant in UTC.
          </p>
          <Label htmlFor="blog-schedule-time">Publication date and time</Label>
          <Input
            id="blog-schedule-time"
            min={scheduleMinimum}
            onChange={(event) => setScheduledFor(event.target.value)}
            required
            type="datetime-local"
            value={scheduledFor}
          />
          <div className="blog-dialog-actions">
            <Button onClick={() => setScheduleOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function SettingsPanel({
  prefix,
  post,
  categories,
  tags,
  slug,
  selectedCategories,
  selectedTags,
  featuredMediaId,
  media,
  seoTitle,
  seoDescription,
  canArchive,
  canDelete,
  onSlug,
  onCategories,
  onTags,
  onSeoTitle,
  onSeoDescription,
  onFeatured,
  onFeaturedRemove,
  onArchive,
  onDelete,
}: {
  prefix: string;
  post: BlogPostAdmin | undefined;
  categories: readonly BlogTaxonomy[];
  tags: readonly BlogTaxonomy[];
  slug: string;
  selectedCategories: string[];
  selectedTags: string[];
  featuredMediaId: string;
  media: BlogMedia[];
  seoTitle: string;
  seoDescription: string;
  canArchive: boolean;
  canDelete: boolean;
  onDirty: () => void;
  onSlug: (value: string) => void;
  onCategories: (ids: string[]) => void;
  onTags: (ids: string[]) => void;
  onSeoTitle: (value: string) => void;
  onSeoDescription: (value: string) => void;
  onFeatured: () => void;
  onFeaturedRemove: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const featured = media.find(({ id }) => id === featuredMediaId);
  return (
    <div className="blog-settings-groups">
      <section>
        <h2>Publishing</h2>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{post?.status.replaceAll("_", " ") ?? "Draft after first save"}</dd>
          </div>
          <div>
            <dt>Author</dt>
            <dd>{post?.author.displayName ?? "Current signed-in author"}</dd>
          </div>
          {post?.scheduledFor ? (
            <div>
              <dt>Scheduled</dt>
              <dd>
                {new Intl.DateTimeFormat("en-CA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(post.scheduledFor))}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      <section>
        <h2>Featured Image</h2>
        {featured ? (
          <img alt={featured.altText} src={mediaUrl(featured.id, "featured")} />
        ) : (
          <div className="blog-featured-empty">No featured image selected.</div>
        )}
        <div className="blog-sidebar-actions">
          <Button onClick={onFeatured} type="button" variant="outline">
            {featured ? "Replace" : "Choose Existing"}
          </Button>
          {featured ? (
            <Button onClick={onFeaturedRemove} type="button" variant="outline">
              Remove
            </Button>
          ) : null}
        </div>
      </section>
      <section>
        <h2>Article Details</h2>
        <fieldset>
          <legend>Categories</legend>
          {categories.map((item) => (
            <Label key={item.id}>
              <Checkbox
                checked={selectedCategories.includes(item.id)}
                onChange={() =>
                  onCategories(
                    selectedCategories.includes(item.id)
                      ? selectedCategories.filter((id) => id !== item.id)
                      : [...selectedCategories, item.id],
                  )
                }
              />
              {item.name}
            </Label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Tags</legend>
          {tags.map((item) => (
            <Label key={item.id}>
              <Checkbox
                checked={selectedTags.includes(item.id)}
                onChange={() =>
                  onTags(
                    selectedTags.includes(item.id)
                      ? selectedTags.filter((id) => id !== item.id)
                      : [...selectedTags, item.id],
                  )
                }
              />
              {item.name}
            </Label>
          ))}
        </fieldset>
      </section>
      <section>
        <h2>SEO</h2>
        <Label htmlFor={`${prefix}-blog-slug`}>Slug</Label>
        <Input
          id={`${prefix}-blog-slug`}
          onChange={(event) => onSlug(event.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={slug}
        />
        <p>Published slug changes create a permanent redirect.</p>
        <Label htmlFor={`${prefix}-blog-seo-title`}>SEO title</Label>
        <Input
          id={`${prefix}-blog-seo-title`}
          maxLength={70}
          onChange={(event) => onSeoTitle(event.target.value)}
          value={seoTitle}
        />
        <span>{seoTitle.length}/70</span>
        <Label htmlFor={`${prefix}-blog-seo-description`}>Meta description</Label>
        <Textarea
          id={`${prefix}-blog-seo-description`}
          maxLength={170}
          onChange={(event) => onSeoDescription(event.target.value)}
          value={seoDescription}
        />
        <span>{seoDescription.length}/170</span>
        <div className="blog-search-preview">
          <small>Search preview</small>
          <strong>{seoTitle || post?.title || "Article title"}</strong>
          <span>/blog/{slug || "article-slug"}</span>
          <p>{seoDescription || post?.excerpt || "Article description will appear here."}</p>
        </div>
      </section>
      <section>
        <h2>Publishing Checks</h2>
        <ul>
          <li className={post?.title ? "is-complete" : ""}>Title</li>
          <li className={featured ? "is-complete" : ""}>Featured image</li>
          <li className={selectedCategories.length ? "is-complete" : ""}>Category</li>
          <li className={featured?.altText ? "is-complete" : ""}>Image alt text</li>
        </ul>
      </section>
      {post && (canArchive || (canDelete && post.status === "DRAFT")) ? (
        <section>
          <h2>Lifecycle</h2>
          <div className="blog-sidebar-actions">
            {canArchive && post.status !== "ARCHIVED" ? (
              <Button onClick={onArchive} type="button" variant="outline">
                Archive
              </Button>
            ) : null}
            {canDelete && post.status === "DRAFT" ? (
              <Button onClick={onDelete} type="button" variant="destructive">
                Delete Draft
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
