import type { JSONContent } from "@tiptap/core";
import type {
  StructuredTextBlock,
  StructuredTextDocument,
  StructuredTextInline,
} from "@ctps/types";

function editorMarks(marks: StructuredTextInline["marks"]): NonNullable<JSONContent["marks"]> {
  return marks.map((mark) =>
    mark.type === "link" ? { type: "link", attrs: { href: mark.href } } : { type: mark.type },
  );
}

function inlineToEditor(content: readonly StructuredTextInline[]): JSONContent[] {
  return content.map((node) => ({ type: "text", text: node.text, marks: editorMarks(node.marks) }));
}

export function legacyProjectText(text: string): StructuredTextDocument {
  return text
    .split(/\n+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({
      type: "richText",
      style: "paragraph",
      content: [{ type: "text", text: value, marks: [] }],
    }));
}

export function projectBlocksToEditorDocument(blocks: StructuredTextDocument): JSONContent {
  const content = blocks.map<JSONContent>((block) => {
    if (block.type === "richList")
      return {
        type: block.style === "bullet" ? "bulletList" : "orderedList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: inlineToEditor(item) }],
        })),
      };
    const heading = block.style.match(/^heading([23])$/);
    return {
      type: heading ? "heading" : block.style === "blockquote" ? "blockquote" : "paragraph",
      ...(heading ? { attrs: { level: Number(heading[1]) } } : {}),
      content: inlineToEditor(block.content),
    };
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function editorInline(nodes: readonly JSONContent[] | undefined): StructuredTextInline[] {
  return (nodes ?? [])
    .filter((node) => node.type === "text" && Boolean(node.text))
    .map((node) => ({
      type: "text",
      text: node.text!,
      marks: (node.marks ?? []).flatMap<StructuredTextInline["marks"][number]>((mark) => {
        if (mark.type === "bold" || mark.type === "italic" || mark.type === "underline")
          return [{ type: mark.type }];
        if (mark.type === "link" && typeof mark.attrs?.href === "string")
          return [{ type: "link", href: mark.attrs.href }];
        return [];
      }),
    }));
}

export function editorDocumentToProjectBlocks(document: JSONContent): StructuredTextBlock[] {
  return (document.content ?? []).flatMap<StructuredTextBlock>((node) => {
    if (
      node.type === "paragraph" ||
      (node.type === "heading" && (node.attrs?.level === 2 || node.attrs?.level === 3))
    ) {
      const content = editorInline(node.content);
      if (!content.length) return [];
      return [
        {
          type: "richText",
          style:
            node.type === "heading"
              ? (`heading${node.attrs?.level}` as "heading2" | "heading3")
              : "paragraph",
          content,
        },
      ];
    }
    if (node.type === "blockquote") {
      const content = editorInline(node.content?.[0]?.content);
      return content.length ? [{ type: "richText", style: "blockquote", content }] : [];
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      const items = (node.content ?? [])
        .map((item) => editorInline(item.content?.[0]?.content))
        .filter((item) => item.length);
      return items.length
        ? [{ type: "richList", style: node.type === "bulletList" ? "bullet" : "numbered", items }]
        : [];
    }
    return [];
  });
}

export function projectBlocksText(blocks: StructuredTextDocument): string {
  return blocks
    .flatMap((block) =>
      block.type === "richText"
        ? block.content.map(({ text }) => text)
        : block.items.flatMap((item) => item.map(({ text }) => text)),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
