// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlogPostEditor } from "../src/components/blog-post-editor";

const props = {
  categories: [{ id: "category", name: "Window Care", slug: "window-care" }],
  tags: [{ id: "tag", name: "Seasonal", slug: "seasonal" }],
  canPublish: false,
  canSchedule: false,
  canArchive: false,
  canDelete: false,
  canUpload: true,
  canUpdateMedia: true,
  canDeleteMedia: true,
} as const;

beforeEach(() => {
  vi.spyOn(URL, "createObjectURL")
    .mockReturnValueOnce("blob:first")
    .mockReturnValueOnce("blob:second");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("blog post editor", () => {
  it("provides structured blocks, managed media, taxonomy, SEO, and explicit Draft saving without an external image URL", () => {
    render(<BlogPostEditor {...props} />);
    expect(screen.getByRole("heading", { name: "Create blog post" })).not.toBeNull();
    expect(screen.getByLabelText("Add content block")).not.toBeNull();
    expect(screen.getByLabelText("Select multiple images")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Save Draft" })).not.toBeNull();
    expect(screen.queryByLabelText(/external image url/i)).toBeNull();
    expect(screen.queryByText(/comments/i)).toBeNull();
  });
  it("previews multiple local files, reorders, and removes a pending upload", async () => {
    const user = userEvent.setup();
    render(<BlogPostEditor {...props} />);
    await user.upload(screen.getByLabelText("Select multiple images"), [
      new File(["one"], "one.jpg", { type: "image/jpeg" }),
      new File(["two"], "two.jpg", { type: "image/jpeg" }),
    ]);
    expect(screen.getByText("one.jpg")).not.toBeNull();
    expect(screen.getByText("two.jpg")).not.toBeNull();
    const down = screen.getAllByRole("button", { name: "Down" })[0]!;
    await user.click(down);
    const removes = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removes[0]!);
    expect(screen.queryByText("two.jpg")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
  it("protects unsaved work and reports an optimistic-concurrency conflict", async () => {
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
    const { container } = render(<BlogPostEditor {...props} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Changed title" } });
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "changed-title" } });
    fireEvent.change(screen.getByLabelText("Excerpt"), { target: { value: "A useful excerpt" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(
      await screen.findByText(
        "This post changed elsewhere. Reload and review before saving again.",
      ),
    ).not.toBeNull();
  });
});
