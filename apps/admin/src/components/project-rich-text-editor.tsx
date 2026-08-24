"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { Editor, Range } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { StructuredTextDocument } from "@ctps/types";
import { Button, Input, Label, Select } from "@ctps/ui/primitives";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from "@ctps/ui/icons";

import {
  editorDocumentToProjectBlocks,
  projectBlocksToEditorDocument,
} from "../lib/project-rich-text";

type Field = "summary" | "description";

function safeLink(value: string) {
  const link = value.trim();
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    return ["http:", "https:"].includes(new URL(link).protocol) ? link : null;
  } catch {
    return null;
  }
}

function Tool({
  active = false,
  disabled = false,
  label,
  onActivate,
  children,
}: {
  readonly active?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly label: string;
  readonly onActivate: () => unknown;
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

const pasteSanitizer = (html: string) =>
  html
    .replace(/<\/?(?:script|style|iframe|object|embed|form|svg)[^>]*>/gi, "")
    .replace(/\s(?:style|class|id|data-[\w-]+|on\w+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

export function ProjectRichTextEditor({
  summary,
  description,
  onSummaryChange,
  onDescriptionChange,
}: {
  readonly summary: StructuredTextDocument;
  readonly description: StructuredTextDocument;
  readonly onSummaryChange: (value: StructuredTextDocument) => void;
  readonly onDescriptionChange: (value: StructuredTextDocument) => void;
}) {
  const [, refresh] = useReducer((value) => value + 1, 0);
  const [activeField, setActiveField] = useState<Field>("description");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const selection = useRef<Range | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const extensions = [
    StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
    Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false }),
  ];
  const summaryEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...extensions,
      Placeholder.configure({ placeholder: "A concise transformation summary…" }),
    ],
    content: projectBlocksToEditorDocument(summary),
    editorProps: {
      attributes: {
        "aria-label": "Project summary",
        class: "project-rich-content project-summary-content",
      },
      transformPastedHTML: pasteSanitizer,
    },
    onFocus: () => setActiveField("summary"),
    onSelectionUpdate: refresh,
    onUpdate: ({ editor }) => onSummaryChange(editorDocumentToProjectBlocks(editor.getJSON())),
  });
  const descriptionEditor = useEditor({
    immediatelyRender: false,
    extensions: [...extensions, Placeholder.configure({ placeholder: "Tell the project story…" })],
    content: projectBlocksToEditorDocument(description),
    editorProps: {
      attributes: {
        "aria-label": "Project description",
        class: "project-rich-content project-description-content",
      },
      transformPastedHTML: pasteSanitizer,
    },
    onFocus: () => setActiveField("description"),
    onSelectionUpdate: refresh,
    onUpdate: ({ editor }) => onDescriptionChange(editorDocumentToProjectBlocks(editor.getJSON())),
  });
  useEffect(() => {
    if (linkOpen) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [linkOpen]);
  const active =
    (activeField === "summary" ? summaryEditor : descriptionEditor) ??
    descriptionEditor ??
    summaryEditor;
  const setBlock = (editor: Editor, value: string) => {
    const chain = editor.chain().focus();
    if (value === "paragraph") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(value.at(-1)) as 2 | 3 }).run();
  };
  const openLink = () => {
    if (!active) return;
    selection.current = { from: active.state.selection.from, to: active.state.selection.to };
    setLinkValue(String(active.getAttributes("link").href ?? ""));
    setLinkError("");
    setLinkOpen(true);
  };
  const applyLink = () => {
    if (!active) return;
    const href = safeLink(linkValue);
    if (!href) {
      setLinkError("Use an internal path or a safe HTTP/HTTPS address.");
      return;
    }
    const chain = active.chain().focus();
    if (selection.current) chain.setTextSelection(selection.current);
    chain.extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  };
  const removeLink = () => {
    if (!active) return;
    const chain = active.chain().focus();
    if (selection.current) chain.setTextSelection(selection.current);
    chain.extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };
  const block = active?.isActive("heading", { level: 2 })
    ? "heading2"
    : active?.isActive("heading", { level: 3 })
      ? "heading3"
      : "paragraph";
  return (
    <>
      <div
        aria-label="Project text formatting"
        className="blog-format-toolbar project-format-toolbar"
        role="toolbar"
      >
        <Select
          aria-label="Block type"
          className="blog-block-select"
          disabled={!active}
          onChange={(event) => active && setBlock(active, event.target.value)}
          value={block}
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading2">Heading 2</option>
          <option value="heading3">Heading 3</option>
        </Select>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <Tool
          active={active?.isActive("bold")}
          label="Bold"
          onActivate={() => active?.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden="true" />
        </Tool>
        <Tool
          active={active?.isActive("italic")}
          label="Italic"
          onActivate={() => active?.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden="true" />
        </Tool>
        <Tool
          active={active?.isActive("underline")}
          label="Underline"
          onActivate={() => active?.chain().focus().toggleUnderline().run()}
        >
          <Underline aria-hidden="true" />
        </Tool>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <Tool
          active={active?.isActive("bulletList")}
          label="Bullet list"
          onActivate={() => active?.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" />
        </Tool>
        <Tool
          active={active?.isActive("orderedList")}
          label="Numbered list"
          onActivate={() => active?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" />
        </Tool>
        <Tool
          active={active?.isActive("blockquote")}
          label="Blockquote"
          onActivate={() => active?.chain().focus().toggleBlockquote().run()}
        >
          <Quote aria-hidden="true" />
        </Tool>
        <Tool active={active?.isActive("link")} label="Link" onActivate={openLink}>
          <Link2 aria-hidden="true" />
        </Tool>
        <span aria-hidden="true" className="blog-toolbar-separator" />
        <Tool
          disabled={!active?.can().chain().focus().undo().run()}
          label="Undo"
          onActivate={() => active?.chain().focus().undo().run()}
        >
          <Undo2 aria-hidden="true" />
        </Tool>
        <Tool
          disabled={!active?.can().chain().focus().redo().run()}
          label="Redo"
          onActivate={() => active?.chain().focus().redo().run()}
        >
          <Redo2 aria-hidden="true" />
        </Tool>
        <span className="project-toolbar-target">Editing {activeField}</span>
      </div>
      <div className="project-story-editors">
        <section>
          <div className="project-section-heading">
            <div>
              <h3>Summary</h3>
              <p>Keep the public introduction concise and useful.</p>
            </div>
          </div>
          <EditorContent className="project-rich-editor" editor={summaryEditor} />
        </section>
        <section>
          <div className="project-section-heading">
            <div>
              <h3>Description</h3>
              <p>Describe the work, approach, and result. The project title remains the page H1.</p>
            </div>
          </div>
          <EditorContent className="project-rich-editor" editor={descriptionEditor} />
        </section>
      </div>
      <dialog
        aria-labelledby="project-link-title"
        className="blog-editor-dialog"
        onClose={() => setLinkOpen(false)}
        ref={dialog}
      >
        <div>
          <h2 id="project-link-title">Project link</h2>
          <p>Add a safe internal or HTTP/HTTPS destination.</p>
          <Label htmlFor="project-link-url">Destination</Label>
          <Input
            autoFocus
            id="project-link-url"
            onChange={(event) => setLinkValue(event.target.value)}
            value={linkValue}
          />
          {linkError ? (
            <p className="text-destructive" role="alert">
              {linkError}
            </p>
          ) : null}
          <div className="blog-dialog-actions">
            {active?.isActive("link") ? (
              <Button onClick={removeLink} type="button" variant="outline">
                Remove link
              </Button>
            ) : null}
            <Button onClick={() => setLinkOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button onClick={applyLink} type="button">
              Apply link
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
