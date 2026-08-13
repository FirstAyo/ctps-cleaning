import { describe, expect, it } from "vitest";

import {
  blogBlocksToEditorDocument,
  editorDocumentToBlogBlocks,
} from "../src/lib/blog-editor-content";

describe("Blog editor structured-content conversion", () => {
  it("round-trips inline marks, safe links, H4, lists, dividers, and managed images", () => {
    const blocks = [
      {
        type: "richText" as const,
        style: "heading4" as const,
        content: [
          {
            type: "text" as const,
            text: "Care guidance",
            marks: [
              { type: "bold" as const },
              { type: "italic" as const },
              { type: "underline" as const },
              { type: "link" as const, href: "/services" },
            ],
          },
        ],
      },
      {
        type: "richList" as const,
        style: "numbered" as const,
        items: [[{ type: "text" as const, text: "First", marks: [] }]],
      },
      {
        type: "managedImage" as const,
        mediaId: "00000000-0000-4000-8000-000000000001",
        layout: "wide" as const,
      },
      { type: "divider" as const },
    ];
    const document = blogBlocksToEditorDocument(blocks, []);
    expect(editorDocumentToBlogBlocks(document)).toEqual(blocks);
  });

  it("loads legacy Phase 8 blocks without exposing HTML", () => {
    const document = blogBlocksToEditorDocument(
      [{ type: "paragraph", text: "Legacy content", emphasis: true }],
      [],
    );
    const result = editorDocumentToBlogBlocks(document);
    expect(result).toEqual([
      {
        type: "richText",
        style: "paragraph",
        content: [{ type: "text", text: "Legacy content", marks: [{ type: "bold" }] }],
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("<p>");
  });
});
