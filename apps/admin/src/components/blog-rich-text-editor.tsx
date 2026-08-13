"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { mergeAttributes, Node, type Editor, type Range } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { NodeSelection } from "@tiptap/pm/state";
import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "@ctps/ui/icons";

import { blogBlocksToEditorDocument, editorDocumentToBlogBlocks } from "../lib/blog-editor-content";
import type { BlogBlock, BlogMedia } from "../lib/blog-types";

const ManagedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: { default: null, parseHTML: (element) => element.dataset.mediaId },
      layout: { default: "standard", parseHTML: (element) => element.dataset.layout },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-media-id": HTMLAttributes.mediaId,
        "data-layout": HTMLAttributes.layout,
      }),
    ];
  },
});

const BlogCallout = Node.create({
  name: "blogCallout",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return { title: { default: "" }, text: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "aside[data-blog-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, { "data-blog-callout": "true" }),
      ["strong", {}, HTMLAttributes.title || "Callout"],
      ["p", {}, HTMLAttributes.text],
    ];
  },
});

function safeLink(value: string) {
  const link = value.trim();
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    return ["http:", "https:"].includes(new URL(link).protocol) ? link : null;
  } catch {
    return null;
  }
}

function EditorButton({
  active = false,
  disabled = false,
  label,
  onActivate,
  children,
}: {
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onActivate: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className="blog-format-button"
      disabled={disabled}
      onClick={onActivate}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export function BlogRichTextEditor({
  blocks,
  media,
  onChange,
  onImageRequest,
}: {
  readonly blocks: readonly BlogBlock[];
  readonly media: readonly BlogMedia[];
  readonly onChange: (blocks: BlogBlock[]) => void;
  readonly onImageRequest: (
    insert: (item: BlogMedia, layout: "standard" | "wide" | "full") => void,
    editing: boolean,
  ) => void;
}) {
  const [, renderSelection] = useReducer((value) => value + 1, 0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const selection = useRef<Range | null>(null);
  const linkDialog = useRef<HTMLDialogElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false }),
      ManagedImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing your articleâ€¦" }),
      BlogCallout,
    ],
    content: blogBlocksToEditorDocument(blocks, media),
    editorProps: {
      attributes: {
        "aria-label": "Article content",
        class: "blog-writing-content",
      },
      transformPastedHTML: (html) =>
        html
          .replace(/<\/?(?:script|style|iframe|object|embed|form)[^>]*>/gi, "")
          .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ""),
    },
    onUpdate: ({ editor: current }) => onChange(editorDocumentToBlogBlocks(current.getJSON())),
    onSelectionUpdate: () => renderSelection(),
  });

  useEffect(() => {
    const dialog = linkDialog.current;
    if (linkOpen) dialog?.showModal();
    else if (dialog?.open) dialog.close();
  }, [linkOpen]);

  if (!editor) return <div className="blog-editor-loading">Loading writing canvasâ€¦</div>;

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "paragraph") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(value.at(-1)) as 2 | 3 | 4 }).run();
  };
  const openLink = () => {
    selection.current = { from: editor.state.selection.from, to: editor.state.selection.to };
    setLinkValue(String(editor.getAttributes("link").href ?? ""));
    setLinkError("");
    setLinkOpen(true);
  };
  const applyLink = () => {
    const href = safeLink(linkValue);
    if (!href) {
      setLinkError("Use an internal path or a safe HTTP/HTTPS address.");
      return;
    }
    const range = selection.current;
    const chain = editor.chain().focus();
    if (range) chain.setTextSelection(range);
    chain.extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  };
  const removeLink = () => {
    const range = selection.current;
    const chain = editor.chain().focus();
    if (range) chain.setTextSelection(range);
    chain.extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };
  const requestImage = () => {
    const editing = editor.isActive("image");
    onImageRequest((item, layout) => {
      const attrs = {
        src: `/api/blog-media/${item.id}/article-standard`,
        alt: item.altText,
        title: item.caption ?? null,
        mediaId: item.id,
        layout,
      };
      if (editing) editor.chain().focus().updateAttributes("image", attrs).run();
      else editor.chain().focus().insertContent({ type: "image", attrs }).run();
    }, editing);
  };
  const moveImage = (direction: -1 | 1) => {
    editor.commands.command(({ state, tr, dispatch }) => {
      const position = state.selection.from;
      const node = state.doc.nodeAt(position);
      if (!node || node.type.name !== "image") return false;
      const resolved = state.doc.resolve(position);
      if (direction === -1) {
        const previous = resolved.nodeBefore;
        if (!previous) return false;
        const target = position - previous.nodeSize;
        tr.delete(position, position + node.nodeSize).insert(target, node);
        tr.setSelection(NodeSelection.create(tr.doc, target));
      } else {
        const next = state.doc.nodeAt(position + node.nodeSize);
        if (!next) return false;
        tr.delete(position, position + node.nodeSize).insert(position + next.nodeSize, node);
        tr.setSelection(NodeSelection.create(tr.doc, position + next.nodeSize));
      }
      dispatch?.(tr.scrollIntoView());
      return true;
    });
  };
  const blockLabel = editor.isActive("heading", { level: 2 })
    ? "heading2"
    : editor.isActive("heading", { level: 3 })
      ? "heading3"
      : editor.isActive("heading", { level: 4 })
        ? "heading4"
        : "paragraph";

  return (
    <>
      <div aria-label="Formatting toolbar" className="blog-format-toolbar" role="toolbar">
        <Select
          aria-label="Block type"
          className="blog-block-select"
          onChange={(event) => setBlock(event.target.value)}
          value={blockLabel}
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading2">Heading 2</option>
          <option value="heading3">Heading 3</option>
          <option value="heading4">Heading 4</option>
        </Select>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <EditorButton
          active={editor.isActive("bold")}
          label="Bold"
          onActivate={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden="true" />
        </EditorButton>
        <EditorButton
          active={editor.isActive("italic")}
          label="Italic"
          onActivate={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden="true" />
        </EditorButton>
        <EditorButton
          active={editor.isActive("underline")}
          label="Underline"
          onActivate={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon aria-hidden="true" />
        </EditorButton>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <EditorButton
          active={editor.isActive("bulletList")}
          label="Bullet list"
          onActivate={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" />
        </EditorButton>
        <EditorButton
          active={editor.isActive("orderedList")}
          label="Numbered list"
          onActivate={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" />
        </EditorButton>
        <EditorButton
          active={editor.isActive("blockquote")}
          label="Blockquote"
          onActivate={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote aria-hidden="true" />
        </EditorButton>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <EditorButton active={editor.isActive("link")} label="Link" onActivate={openLink}>
          <Link2 aria-hidden="true" />
        </EditorButton>
        <EditorButton
          active={editor.isActive("image")}
          label={editor.isActive("image") ? "Replace image" : "Insert image"}
          onActivate={requestImage}
        >
          <ImageIcon aria-hidden="true" />
        </EditorButton>
        {editor.isActive("image") ? (
          <>
            <EditorButton label="Move image up" onActivate={() => moveImage(-1)}>
              <ArrowUp aria-hidden="true" />
            </EditorButton>
            <EditorButton label="Move image down" onActivate={() => moveImage(1)}>
              <ArrowDown aria-hidden="true" />
            </EditorButton>
            <EditorButton
              label="Remove image"
              onActivate={() => editor.chain().focus().deleteSelection().run()}
            >
              <X aria-hidden="true" />
            </EditorButton>
          </>
        ) : null}
        <EditorButton
          label="Divider"
          onActivate={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus aria-hidden="true" />
        </EditorButton>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <EditorButton
          disabled={!editor.can().chain().focus().undo().run()}
          label="Undo"
          onActivate={() => editor.chain().focus().undo().run()}
        >
          <Undo2 aria-hidden="true" />
        </EditorButton>
        <EditorButton
          disabled={!editor.can().chain().focus().redo().run()}
          label="Redo"
          onActivate={() => editor.chain().focus().redo().run()}
        >
          <Redo2 aria-hidden="true" />
        </EditorButton>
      </div>
      <EditorContent className="blog-writing-editor" editor={editor} />
      <dialog
        aria-labelledby="blog-link-title"
        className="blog-editor-dialog"
        onClose={() => setLinkOpen(false)}
        ref={linkDialog}
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            applyLink();
          }}
        >
          <h2 id="blog-link-title">Link</h2>
          <p>Edit the selected link or add a safe internal or HTTP/HTTPS destination.</p>
          <Label htmlFor="blog-link-url">Destination</Label>
          <Input
            autoFocus
            id="blog-link-url"
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="/services or https://example.com"
            value={linkValue}
          />
          {linkError ? (
            <p className="text-destructive" role="alert">
              {linkError}
            </p>
          ) : null}
          <div className="blog-dialog-actions">
            {editor.isActive("link") ? (
              <Button onClick={removeLink} type="button" variant="outline">
                Remove link
              </Button>
            ) : null}
            <Button onClick={() => setLinkOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Apply link</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export type BlogEditorInstance = Editor;
