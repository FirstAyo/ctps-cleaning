"use client";

/* eslint-disable @next/next/no-img-element -- local object URLs and authenticated media routes */

import { useEffect, useState } from "react";
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
import Link from "next/link";

import type { BlogBlock, BlogMedia, BlogPostAdmin, BlogTaxonomy } from "@/lib/blog-types";

type Pending = {
  id: string;
  file: File;
  url: string;
  status: "selected" | "uploading" | "failed";
  error?: string;
};
const emptyBlock = (type: BlogBlock["type"]): BlogBlock => {
  if (type === "bulletList" || type === "numberedList") return { type, items: [""] };
  if (type === "link") return { type, text: "", href: "", emphasis: false };
  if (type === "image") return { type, mediaId: "" };
  if (type === "callout") return { type, title: "", text: "" };
  if (type === "divider") return { type };
  return { type, text: "", emphasis: false };
};
const mediaUrl = (id: string, variant = "thumbnail") => `/api/blog-media/${id}/${variant}`;

export function BlogPostEditor({
  post,
  categories,
  tags,
  canPublish,
  canSchedule,
  canArchive,
  canDelete,
  canUpload,
  canUpdateMedia,
  canDeleteMedia,
}: {
  readonly post?: BlogPostAdmin;
  readonly categories: readonly BlogTaxonomy[];
  readonly tags: readonly BlogTaxonomy[];
  readonly canPublish: boolean;
  readonly canSchedule: boolean;
  readonly canArchive: boolean;
  readonly canDelete: boolean;
  readonly canUpload: boolean;
  readonly canUpdateMedia: boolean;
  readonly canDeleteMedia: boolean;
}) {
  const [blocks, setBlocks] = useState<BlogBlock[]>(post?.content ?? []);
  const [media, setMedia] = useState<BlogMedia[]>(post?.media.map((item) => item.media) ?? []);
  const [pending, setPending] = useState<Pending[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState(post?.featuredMediaId ?? "");
  const [selectedCategories, setSelectedCategories] = useState(
    post?.categories.map(({ id }) => id) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState(post?.tags.map(({ id }) => id) ?? []);
  const [version, setVersion] = useState(post?.version ?? 1);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => () => pending.forEach(({ url }) => URL.revokeObjectURL(url)), [pending]);

  function updateBlock(index: number, block: BlogBlock) {
    setBlocks((items) => items.map((item, position) => (position === index ? block : item)));
    setDirty(true);
  }
  function move<T>(items: T[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    return copy;
  }
  function selectFiles(files: FileList | null) {
    const next = [...(files ?? [])].map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      status: "selected" as const,
    }));
    setPending((items) => [...items, ...next].slice(0, 10));
    setDirty(true);
  }
  async function uploadSelected() {
    const selected = pending.filter(({ status }) => status !== "uploading");
    if (!selected.length) return;
    setPending((items) =>
      items.map((item) => ({
        id: item.id,
        file: item.file,
        url: item.url,
        status: "uploading",
      })),
    );
    const body = new FormData();
    selected.forEach(({ file }) => body.append("files", file));
    const response = await fetch("/api/blog-media", { method: "POST", body });
    const result = (await response.json().catch(() => ({}))) as {
      items?: BlogMedia[];
      message?: string;
    };
    if (!response.ok || !result.items) {
      setPending((items) =>
        items.map((item) => ({
          ...item,
          status: "failed",
          error: result.message ?? "Upload failed.",
        })),
      );
      setFeedback(result.message ?? "The selected images could not be uploaded.");
      setFailed(true);
      return;
    }
    pending.forEach(({ url }) => URL.revokeObjectURL(url));
    setPending([]);
    setMedia((items) => [...items, ...result.items!]);
    setFeedback(`${result.items.length} managed image(s) uploaded privately.`);
    setFailed(false);
  }
  async function updateMedia(item: BlogMedia) {
    if (!canUpdateMedia) return;
    const response = await fetch(`/api/admin/blog/media/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ altText: item.altText, caption: item.caption }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? "Media details could not be saved.");
    }
  }
  async function deleteMedia(item: BlogMedia) {
    if (
      blocks.some((block) => block.type === "image" && block.mediaId === item.id) ||
      featuredMediaId === item.id
    ) {
      setFailed(true);
      setFeedback(
        "Remove this managed image from content and featured-image use before deleting it.",
      );
      return;
    }
    if (!confirm(`Permanently delete ${item.originalFilename}?`)) return;
    const response = await fetch(`/api/admin/blog/media/${item.id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setFailed(true);
      setFeedback(
        result.message ?? "The managed image could not be deleted. Save detach changes first.",
      );
      return;
    }
    setMedia((items) => items.filter(({ id }) => id !== item.id));
    setFailed(false);
    setFeedback("Unused managed image deleted.");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await Promise.all(media.map(updateMedia));
      const payload = {
        title: String(form.get("title")),
        slug: String(form.get("slug")),
        excerpt: String(form.get("excerpt")),
        content: blocks,
        featuredMediaId: featuredMediaId || null,
        media: media.map((item, sortOrder) => ({ mediaId: item.id, sortOrder })),
        categoryIds: selectedCategories,
        tagIds: selectedTags,
        seoTitle: String(form.get("seoTitle") || "") || null,
        seoDescription: String(form.get("seoDescription") || "") || null,
        ...(post ? { version } : {}),
      };
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
      if (!post) window.location.assign(`/blog/posts/${result.id}`);
      else setVersion(result.version);
      setDirty(false);
      setFailed(false);
      setFeedback("Draft changes and a new revision were saved.");
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "The post could not be saved.");
    }
  }
  async function lifecycle(action: string) {
    if (!post) return;
    if (
      ["publish", "unpublish", "archive", "delete"].includes(action) &&
      !confirm(`Confirm ${action} for this post?`)
    )
      return;
    const scheduledFor =
      action === "schedule"
        ? prompt(
            "Schedule time in ISO format with timezone",
            new Date(Date.now() + 3600000).toISOString(),
          )
        : null;
    if (action === "schedule" && !scheduledFor) return;
    const response = await fetch(
      `/api/admin/blog/posts/${post.id}${action === "delete" ? "" : `/${action}`}`,
      action === "delete"
        ? { method: "DELETE", headers: { "content-type": "application/json" } }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(action === "schedule" ? { version, scheduledFor } : { version }),
          },
    );
    const result = (await response.json().catch(() => ({}))) as BlogPostAdmin & {
      message?: string;
    };
    if (!response.ok) {
      setFailed(true);
      setFeedback(result.message ?? `The post could not be ${action}d.`);
      return;
    }
    if (action === "delete") window.location.assign("/blog/posts");
    else {
      setVersion(result.version);
      setFeedback(`Post lifecycle action completed: ${action}.`);
      setFailed(false);
      window.location.reload();
    }
  }

  return (
    <form className="grid gap-6" onChange={() => setDirty(true)} onSubmit={submit}>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{post ? "Edit blog post" : "Create blog post"}</h2>
          <p className="text-sm text-muted-foreground">
            {post
              ? `${post.status} · revision ${post.revisionCount}`
              : "New posts remain Draft until an explicit action."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Save Draft</Button>
          {post ? (
            <Link
              className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold"
              href={`/blog/posts/${post.id}/preview`}
            >
              Preview
            </Link>
          ) : null}
          {post?.status === "DRAFT" ? (
            <Button onClick={() => void lifecycle("submit-review")} type="button" variant="outline">
              Submit for review
            </Button>
          ) : null}
          {post && canPublish && post.status !== "PUBLISHED" ? (
            <Button onClick={() => void lifecycle("publish")} type="button">
              Publish
            </Button>
          ) : null}
          {post && canPublish && post.status === "PUBLISHED" ? (
            <Button onClick={() => void lifecycle("unpublish")} type="button" variant="outline">
              Unpublish
            </Button>
          ) : null}
          {post && canSchedule && ["DRAFT", "IN_REVIEW", "SCHEDULED"].includes(post.status) ? (
            <Button onClick={() => void lifecycle("schedule")} type="button" variant="outline">
              Schedule
            </Button>
          ) : null}
          {post && canArchive && post.status !== "ARCHIVED" ? (
            <Button onClick={() => void lifecycle("archive")} type="button" variant="outline">
              Archive
            </Button>
          ) : null}
          {post && canDelete && post.status === "DRAFT" ? (
            <Button onClick={() => void lifecycle("delete")} type="button" variant="destructive">
              Delete Draft
            </Button>
          ) : null}
        </div>
      </div>
      <section className="grid gap-4 rounded-lg border bg-card p-5">
        {canUpload ? (
          <FieldGroup>
            <Label htmlFor="blog-title">Title</Label>
            <Input defaultValue={post?.title} id="blog-title" name="title" required />
          </FieldGroup>
        ) : (
          <p className="text-sm text-muted-foreground">
            You do not have permission to upload blog media.
          </p>
        )}
        <FieldGroup>
          <Label htmlFor="blog-slug">Slug</Label>
          <Input
            defaultValue={post?.slug}
            id="blog-slug"
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
          <FormDescription>Published slug changes create a permanent redirect.</FormDescription>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="blog-excerpt">Excerpt</Label>
          <Textarea
            defaultValue={post?.excerpt}
            id="blog-excerpt"
            maxLength={500}
            name="excerpt"
            required
          />
        </FieldGroup>
      </section>
      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Structured article content</h3>
            <p className="text-sm text-muted-foreground">
              HTML, scripts, embeds, and arbitrary external images are not accepted.
            </p>
          </div>
          <Select
            aria-label="Add content block"
            defaultValue=""
            onChange={(event) => {
              if (event.currentTarget.value)
                setBlocks((items) => [
                  ...items,
                  emptyBlock(event.currentTarget.value as BlogBlock["type"]),
                ]);
              event.currentTarget.value = "";
            }}
          >
            <option value="">Add block…</option>
            {[
              "paragraph",
              "heading2",
              "heading3",
              "bulletList",
              "numberedList",
              "blockquote",
              "link",
              "image",
              "callout",
              "divider",
            ].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        {blocks.map((block, index) => (
          <BlockEditor
            block={block}
            index={index}
            key={`${block.type}-${index}`}
            media={media}
            move={(direction) => setBlocks((items) => move(items, index, direction))}
            remove={() => setBlocks((items) => items.filter((_, position) => position !== index))}
            update={(next) => updateBlock(index, next)}
          />
        ))}
        {!blocks.length ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Add structured blocks. Drafts may be incomplete; publication validates required content.
          </p>
        ) : null}
      </section>
      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <div>
          <h3 className="text-xl font-semibold">Managed blog images</h3>
          <p className="text-sm text-muted-foreground">
            JPEG, PNG, or WebP. Draft and Scheduled media remains private.
          </p>
        </div>
        <FieldGroup>
          <Label htmlFor="blog-files">Select multiple images</Label>
          <Input
            accept="image/jpeg,image/png,image/webp"
            id="blog-files"
            multiple
            onChange={(event) => selectFiles(event.currentTarget.files)}
            type="file"
          />
        </FieldGroup>
        {pending.length ? (
          <Button onClick={() => void uploadSelected()} type="button" variant="outline">
            Upload selected privately
          </Button>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pending.map((item, index) => (
            <article className="rounded-lg border p-3" key={item.id}>
              <img
                alt="Local upload preview"
                className="aspect-[4/3] w-full object-cover"
                src={item.url}
              />
              <p className="mt-2 truncate text-sm font-semibold">{item.file.name}</p>
              <p className="text-xs">
                {item.status}
                {item.error ? ` · ${item.error}` : ""}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  disabled={index === 0}
                  onClick={() => setPending((items) => move(items, index, -1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Up
                </Button>
                <Button
                  disabled={index === pending.length - 1}
                  onClick={() => setPending((items) => move(items, index, 1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Down
                </Button>
                <Button
                  onClick={() => {
                    URL.revokeObjectURL(item.url);
                    setPending((items) => items.filter(({ id }) => id !== item.id));
                  }}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            </article>
          ))}
          {media.map((item, index) => (
            <article className="rounded-lg border p-3" key={item.id}>
              <img alt="" className="aspect-[4/3] w-full object-cover" src={mediaUrl(item.id)} />
              <p className="mt-2 truncate text-sm font-semibold">{item.originalFilename}</p>
              <FieldGroup className="mt-2">
                <Label htmlFor={`alt-${item.id}`}>Alt text</Label>
                <Input
                  id={`alt-${item.id}`}
                  onChange={(event) =>
                    setMedia((items) =>
                      items.map((candidate) =>
                        candidate.id === item.id
                          ? { ...candidate, altText: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                  value={item.altText}
                />
              </FieldGroup>
              <FieldGroup className="mt-2">
                <Label htmlFor={`caption-${item.id}`}>Caption</Label>
                <Input
                  id={`caption-${item.id}`}
                  onChange={(event) =>
                    setMedia((items) =>
                      items.map((candidate) =>
                        candidate.id === item.id
                          ? { ...candidate, caption: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                  value={item.caption ?? ""}
                />
              </FieldGroup>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  disabled={index === 0}
                  onClick={() => setMedia((items) => move(items, index, -1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Up
                </Button>
                <Button
                  disabled={index === media.length - 1}
                  onClick={() => setMedia((items) => move(items, index, 1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Down
                </Button>
                <Button
                  onClick={() => setFeaturedMediaId(item.id)}
                  size="sm"
                  type="button"
                  variant={featuredMediaId === item.id ? "secondary" : "outline"}
                >
                  {featuredMediaId === item.id ? "Featured" : "Set featured"}
                </Button>
                <Button
                  onClick={() => {
                    if (
                      blocks.some((block) => block.type === "image" && block.mediaId === item.id)
                    ) {
                      setFeedback("Remove this image block before detaching its media.");
                      setFailed(true);
                      return;
                    }
                    setMedia((items) => items.filter(({ id }) => id !== item.id));
                    if (featuredMediaId === item.id) setFeaturedMediaId("");
                  }}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Detach
                </Button>
                {canDeleteMedia ? (
                  <Button
                    onClick={() => void deleteMedia(item)}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    Delete unused
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <h3 className="text-xl font-semibold">Categories and tags</h3>
        <fieldset>
          <legend className="font-semibold">Categories</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {categories.map((item) => (
              <Label className="flex gap-2" key={item.id}>
                <Checkbox
                  checked={selectedCategories.includes(item.id)}
                  onChange={() =>
                    setSelectedCategories((ids) =>
                      ids.includes(item.id)
                        ? ids.filter((id) => id !== item.id)
                        : [...ids, item.id],
                    )
                  }
                />
                {item.name}
              </Label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">Tags</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {tags.map((item) => (
              <Label className="flex gap-2" key={item.id}>
                <Checkbox
                  checked={selectedTags.includes(item.id)}
                  onChange={() =>
                    setSelectedTags((ids) =>
                      ids.includes(item.id)
                        ? ids.filter((id) => id !== item.id)
                        : [...ids, item.id],
                    )
                  }
                />
                {item.name}
              </Label>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <h3 className="text-xl font-semibold">SEO</h3>
        <FieldGroup>
          <Label htmlFor="blog-seo-title">SEO title</Label>
          <Input
            defaultValue={post?.seoTitle ?? ""}
            id="blog-seo-title"
            maxLength={70}
            name="seoTitle"
          />
          <FormDescription>Title fallback is used when blank.</FormDescription>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="blog-seo-description">SEO description</Label>
          <Textarea
            defaultValue={post?.seoDescription ?? ""}
            id="blog-seo-description"
            maxLength={170}
            name="seoDescription"
          />
          <FormDescription>Excerpt fallback is used when blank.</FormDescription>
        </FieldGroup>
      </section>
      <p
        aria-live="polite"
        className={failed ? "font-semibold text-destructive" : "font-semibold text-success"}
        role={failed ? "alert" : "status"}
      >
        {feedback}
      </p>
    </form>
  );
}

function BlockEditor({
  block,
  index,
  media,
  update,
  remove,
  move,
}: {
  block: BlogBlock;
  index: number;
  media: BlogMedia[];
  update: (block: BlogBlock) => void;
  remove: () => void;
  move: (direction: -1 | 1) => void;
}) {
  return (
    <article className="grid gap-3 rounded-md border p-4">
      <div className="flex justify-between">
        <strong>
          Block {index + 1}: {block.type}
        </strong>
        <div className="flex gap-2">
          <Button onClick={() => move(-1)} size="sm" type="button" variant="outline">
            Up
          </Button>
          <Button onClick={() => move(1)} size="sm" type="button" variant="outline">
            Down
          </Button>
          <Button onClick={remove} size="sm" type="button" variant="destructive">
            Remove
          </Button>
        </div>
      </div>
      {"text" in block ? (
        <>
          <Textarea
            aria-label={`${block.type} text`}
            onChange={(event) => update({ ...block, text: event.target.value })}
            value={block.text}
          />
          {"emphasis" in block ? (
            <Label className="flex gap-2">
              <Checkbox
                checked={block.emphasis}
                onChange={() => update({ ...block, emphasis: !block.emphasis })}
              />
              Emphasise this text
            </Label>
          ) : null}
        </>
      ) : null}
      {"items" in block ? (
        <Textarea
          aria-label={`${block.type} items`}
          onChange={(event) => update({ ...block, items: event.target.value.split("\n") })}
          value={block.items.join("\n")}
        />
      ) : null}
      {block.type === "link" ? (
        <Input
          aria-label="Safe link destination"
          onChange={(event) => update({ ...block, href: event.target.value })}
          placeholder="/services or https://example.com"
          value={block.href}
        />
      ) : null}
      {block.type === "image" ? (
        <Select
          aria-label="Managed image"
          onChange={(event) => update({ ...block, mediaId: event.target.value })}
          value={block.mediaId}
        >
          <option value="">Choose managed media</option>
          {media.map((item) => (
            <option key={item.id} value={item.id}>
              {item.originalFilename}
            </option>
          ))}
        </Select>
      ) : null}
      {block.type === "callout" ? (
        <Input
          aria-label="Optional callout title"
          onChange={(event) => update({ ...block, title: event.target.value })}
          value={block.title ?? ""}
        />
      ) : null}
    </article>
  );
}
