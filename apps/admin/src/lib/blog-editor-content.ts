import type { JSONContent } from "@tiptap/core";

import type { BlogBlock, BlogInlineContent, BlogMedia } from "@/lib/blog-types";

const privateMediaUrl = (id: string) => `/api/blog-media/${id}/article-standard`;

function editorMarks(marks: BlogInlineContent["marks"]): NonNullable<JSONContent["marks"]> {
  return marks.map((mark) =>
    mark.type === "link" ? { type: "link", attrs: { href: mark.href } } : { type: mark.type },
  );
}

function inlineToEditor(content: readonly BlogInlineContent[]): JSONContent[] {
  return content.map((node) => ({
    type: "text",
    text: node.text,
    marks: editorMarks(node.marks),
  }));
}

function legacyText(text: string, emphasis = false, href?: string): JSONContent[] {
  return [
    {
      type: "text",
      text,
      marks: [
        ...(emphasis ? [{ type: "bold" }] : []),
        ...(href ? [{ type: "link", attrs: { href } }] : []),
      ],
    },
  ];
}

export function blogBlocksToEditorDocument(
  blocks: readonly BlogBlock[],
  media: readonly BlogMedia[],
): JSONContent {
  const mediaById = new Map(media.map((item) => [item.id, item]));
  const content = blocks.flatMap<JSONContent>((block) => {
    if (block.type === "richText") {
      const heading = block.style.match(/^heading([2-4])$/);
      return [
        {
          type: heading ? "heading" : block.style === "blockquote" ? "blockquote" : "paragraph",
          ...(heading ? { attrs: { level: Number(heading[1]) } } : {}),
          content: inlineToEditor(block.content),
        },
      ];
    }
    if (block.type === "richList") {
      return [
        {
          type: block.style === "bullet" ? "bulletList" : "orderedList",
          content: block.items.map((item) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: inlineToEditor(item) }],
          })),
        },
      ];
    }
    if (block.type === "paragraph" || block.type === "heading2" || block.type === "heading3") {
      return [
        {
          type: block.type === "paragraph" ? "paragraph" : "heading",
          ...(block.type === "paragraph"
            ? {}
            : { attrs: { level: block.type === "heading2" ? 2 : 3 } }),
          content: legacyText(block.text, block.emphasis),
        },
      ];
    }
    if (block.type === "blockquote")
      return [
        {
          type: "blockquote",
          content: [{ type: "paragraph", content: legacyText(block.text, block.emphasis) }],
        },
      ];
    if (block.type === "link")
      return [{ type: "paragraph", content: legacyText(block.text, block.emphasis, block.href) }];
    if (block.type === "bulletList" || block.type === "numberedList")
      return [
        {
          type: block.type === "bulletList" ? "bulletList" : "orderedList",
          content: block.items.map((item) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: legacyText(item) }],
          })),
        },
      ];
    if (block.type === "image" || block.type === "managedImage") {
      const item = mediaById.get(block.mediaId);
      return [
        {
          type: "image",
          attrs: {
            src: privateMediaUrl(block.mediaId),
            alt: item?.altText ?? "",
            title: item?.caption ?? null,
            mediaId: block.mediaId,
            layout: block.type === "managedImage" ? block.layout : "standard",
          },
        },
      ];
    }
    if (block.type === "callout")
      return [{ type: "blogCallout", attrs: { title: block.title ?? "", text: block.text } }];
    return [{ type: "horizontalRule" }];
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function editorInline(nodes: readonly JSONContent[] | undefined): BlogInlineContent[] {
  return (nodes ?? [])
    .filter((node) => node.type === "text" && Boolean(node.text))
    .map((node) => ({
      type: "text" as const,
      text: node.text!,
      marks: (node.marks ?? []).flatMap<BlogInlineContent["marks"][number]>((mark) => {
        if (mark.type === "bold" || mark.type === "italic" || mark.type === "underline")
          return [{ type: mark.type }];
        if (mark.type === "link" && typeof mark.attrs?.href === "string")
          return [{ type: "link", href: mark.attrs.href }];
        return [];
      }),
    }));
}

function paragraphInline(node: JSONContent): BlogInlineContent[] {
  return editorInline(node.content);
}

export function editorDocumentToBlogBlocks(document: JSONContent): BlogBlock[] {
  return (document.content ?? []).flatMap<BlogBlock>((node) => {
    if (node.type === "paragraph" || node.type === "heading") {
      const content = paragraphInline(node);
      if (!content.length) return [];
      return [
        {
          type: "richText",
          style:
            node.type === "heading"
              ? (`heading${node.attrs?.level ?? 2}` as "heading2" | "heading3" | "heading4")
              : "paragraph",
          content,
        },
      ];
    }
    if (node.type === "blockquote") {
      return (node.content ?? []).flatMap<BlogBlock>((paragraph) => {
        const content = paragraphInline(paragraph);
        return content.length ? [{ type: "richText", style: "blockquote", content }] : [];
      });
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      const items = (node.content ?? [])
        .map((listItem) => paragraphInline(listItem.content?.[0] ?? {}))
        .filter((item) => item.length);
      return items.length
        ? [{ type: "richList", style: node.type === "bulletList" ? "bullet" : "numbered", items }]
        : [];
    }
    if (node.type === "image" && typeof node.attrs?.mediaId === "string")
      return [
        {
          type: "managedImage",
          mediaId: node.attrs.mediaId,
          layout: ["wide", "full"].includes(String(node.attrs.layout))
            ? (node.attrs.layout as "wide" | "full")
            : "standard",
        },
      ];
    if (node.type === "blogCallout" && typeof node.attrs?.text === "string")
      return [
        {
          type: "callout",
          ...(node.attrs.title ? { title: String(node.attrs.title) } : {}),
          text: node.attrs.text,
        },
      ];
    if (node.type === "horizontalRule") return [{ type: "divider" }];
    return [];
  });
}

export function blogBlocksText(blocks: readonly BlogBlock[]): string {
  return blocks
    .flatMap((block) => {
      if (block.type === "richText") return block.content.map(({ text }) => text);
      if (block.type === "richList")
        return block.items.flatMap((item) => item.map(({ text }) => text));
      if ("text" in block) return [block.text];
      if ("items" in block) return block.items;
      return [];
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
