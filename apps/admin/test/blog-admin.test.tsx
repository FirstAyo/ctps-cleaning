// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlogPostEditor } from "../src/components/blog-post-editor";
import type { BlogPostAdmin } from "../src/lib/blog-types";

const media = {
  id: "00000000-0000-4000-8000-000000000001",
  originalFilename: "editorial-image.jpg",
  altText: "Clean exterior glass reflecting trees",
  caption: "Exterior glass after routine care.",
  visibility: "PRIVATE" as const,
  width: 1200,
  height: 800,
};
const props = {
  categories: [{ id: "category", name: "Window Care", slug: "window-care" }],
  tags: [{ id: "tag", name: "Seasonal", slug: "seasonal" }],
  libraryMedia: [media],
  canPublish: false,
  canSchedule: false,
  canArchive: false,
  canDelete: false,
  canUpload: true,
  canUpdateMedia: true,
} as const;

beforeEach(() => {
  document.elementFromPoint = () => document.body;
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("professional Blog post editor", () => {
  it("keeps publishing and formatting commands in separate persistent rows", () => {
    const { container } = render(<BlogPostEditor {...props} />);
    const publishing = container.querySelector(".blog-publishing-bar");
    const toolbar = screen.getByRole("toolbar", { name: "Formatting toolbar" });
    const canvas = container.querySelector(".blog-writing-editor");
    expect(publishing).not.toBeNull();
    expect(toolbar).not.toBeNull();
    expect(publishing?.contains(toolbar)).toBe(false);
    expect(canvas?.contains(toolbar)).toBe(false);
    expect(toolbar.classList.contains("blog-format-toolbar")).toBe(true);
  });

  it("exposes every required structured formatting command with active-state semantics", () => {
    render(<BlogPostEditor {...props} />);
    expect(screen.getByLabelText("Block type")).not.toBeNull();
    for (const label of [
      "Bold",
      "Italic",
      "Underline",
      "Bullet list",
      "Numbered list",
      "Blockquote",
      "Link",
      "Insert image",
      "Divider",
      "Undo",
      "Redo",
    ]) {
      const control = screen.getByRole("button", { name: label });
      expect(control.hasAttribute("aria-pressed")).toBe(true);
    }
    expect(screen.getByRole("option", { name: "Heading 4" })).not.toBeNull();
  });

  it("chooses existing Blog media without exposing operational media domains", async () => {
    const user = userEvent.setup();
    const { container } = render(<BlogPostEditor {...props} />);
    await user.click(screen.getAllByRole("button", { name: "Insert image" }).at(-1)!);
    expect(screen.getByRole("heading", { name: "Insert article image" })).not.toBeNull();
    expect(screen.getByText("Choose Existing Blog Media")).not.toBeNull();
    expect(
      screen.getByText(
        "Blog media remains separate from customer, job, portfolio, and marketing assets.",
      ),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /editorial-image\.jpg/i }));
    await user.click(screen.getAllByRole("button", { name: "Insert image" }).at(-1)!);
    expect(
      container.querySelector(
        '.blog-writing-content img[data-media-id="00000000-0000-4000-8000-000000000001"]',
      ),
    ).not.toBeNull();
  });

  it("protects unsaved work and preserves a server conflict message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "BLOG_EDIT_CONFLICT",
            message: "This post changed elsewhere. Reload and review before saving again.",
          }),
          { status: 409, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<BlogPostEditor {...props} />);
    await user.type(screen.getByLabelText("Article title"), "A useful article");
    await user.type(screen.getByLabelText("Excerpt"), "A useful excerpt for readers.");
    const editor = screen.getByLabelText("Article content");
    await user.click(editor);
    await user.keyboard("Useful article content.");
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(
      await screen.findByText(
        "This post changed elsewhere. Reload and review before saving again.",
      ),
    ).not.toBeNull();
  }, 15_000);

  it("keeps the toolbar mounted for a 2,500-word article", () => {
    const longText = Array.from({ length: 2500 }, (_, index) => `word${index}`).join(" ");
    const post = {
      id: "10000000-0000-4000-8000-000000000001",
      slug: "long-article",
      title: "Long article",
      excerpt: "Long-form editor verification.",
      content: [
        {
          type: "richText" as const,
          style: "paragraph" as const,
          content: [{ type: "text" as const, text: longText, marks: [] }],
        },
      ],
      status: "DRAFT" as const,
      authorUserId: "20000000-0000-4000-8000-000000000001",
      author: { displayName: "Writer" },
      featuredMediaId: null,
      featuredMedia: null,
      media: [],
      categories: [],
      tags: [],
      seoTitle: null,
      seoDescription: null,
      publishedAt: null,
      scheduledFor: null,
      readingTimeMinutes: 12,
      version: 1,
      revisionCount: 1,
      updatedAt: new Date().toISOString(),
    } satisfies BlogPostAdmin;
    render(<BlogPostEditor {...props} post={post} />);
    expect(screen.getByText("2,500 words")).not.toBeNull();
    expect(screen.getByRole("toolbar", { name: "Formatting toolbar" })).not.toBeNull();
  });
});
