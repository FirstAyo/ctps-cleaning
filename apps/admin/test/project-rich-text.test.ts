import { describe, expect, it } from "vitest";
import {
  editorDocumentToProjectBlocks,
  legacyProjectText,
  projectBlocksText,
} from "../src/lib/project-rich-text";
import { projectSlugFromTitle } from "../src/lib/project-slug";

describe("before-and-after project content", () => {
  it.each([
    ["Downtown Vancouver Window Cleaning", "downtown-vancouver-window-cleaning"],
    ["  Burnaby   Exterior---Cleaning! ", "burnaby-exterior-cleaning"],
    ["Caf\u00e9 fa\u00e7ade care", "cafe-facade-care"],
  ])("normalizes %s", (title, slug) => expect(projectSlugFromTitle(title)).toBe(slug));

  it("preserves supported semantics and drops unsupported H1, scripts, and iframe nodes", () => {
    const blocks = editorDocumentToProjectBlocks({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Approach", marks: [{ type: "bold" }] }],
        },
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "No body H1" }] },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Safe list" }] }],
            },
          ],
        },
        { type: "script", content: [{ type: "text", text: "alert(1)" }] },
        { type: "iframe" },
      ],
    });
    expect(blocks).toHaveLength(2);
    expect(projectBlocksText(blocks)).toBe("Approach Safe list");
  });

  it("normalizes legacy plain text without content loss", () => {
    const blocks = legacyProjectText("First paragraph\n\nSecond paragraph");
    expect(projectBlocksText(blocks)).toBe("First paragraph Second paragraph");
  });
});
