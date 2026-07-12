"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { RichDoc } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FieldShell";

export interface RichTextFieldProps {
  label: string;
  value: RichDoc;
  onChange: (value: RichDoc) => void;
  error?: string;
  help?: string;
  placeholder?: string;
  className?: string;
}

const EMPTY_DOC: RichDoc = { type: "doc", content: [] };

type UrlPanel =
  | { mode: "link"; url: string }
  | { mode: "image"; url: string; alt: string }
  | null;

function ToolbarButton({
  onClick,
  active,
  label,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active ?? false}
      disabled={disabled}
      className={cn(
        "rounded p-1.5 transition-colors disabled:opacity-30",
        active ? "bg-gold/20 text-gold-deep" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Tiptap rich text editor emitting/consuming Tiptap JSON (RichDoc). */
export function RichTextField({
  label,
  value,
  onChange,
  error,
  help,
  placeholder = "Write here…",
  className,
}: RichTextFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const [panel, setPanel] = useState<UrlPanel>(null);

  // Keep the latest onChange without re-creating the editor.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      ImageExtension,
      Placeholder.configure({ placeholder }),
    ],
    content: (value ?? EMPTY_DOC) as unknown as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-body min-h-[10rem] px-3 py-2 text-sm text-ink focus:outline-none",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getJSON() as unknown as RichDoc);
    },
  });

  // Sync external value changes (e.g. switching the selected block).
  useEffect(() => {
    if (!editor) return;
    const incoming = value ?? EMPTY_DOC;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(incoming)) {
      editor.commands.setContent(incoming as unknown as JSONContent, false);
    }
  }, [value, editor]);

  const openLinkPanel = (e: Editor) => {
    const existing = (e.getAttributes("link").href as string | undefined) ?? "";
    setPanel({ mode: "link", url: existing });
  };

  const applyPanel = () => {
    if (!editor || !panel) return;
    if (panel.mode === "link") {
      const url = panel.url.trim();
      if (url) {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      } else {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      }
    } else {
      const url = panel.url.trim();
      if (url) {
        editor.chain().focus().setImage({ src: url, alt: panel.alt.trim() }).run();
      }
    }
    setPanel(null);
  };

  return (
    <FieldShell
      label={label}
      as="fieldset"
      help={help}
      helpId={helpId}
      error={error}
      errorId={errorId}
      className={className}
    >
      <div
        className={cn(
          "rounded-input border bg-plaster transition-[box-shadow] focus-within:shadow-[inset_0_-2px_0_0_var(--gold)]",
          error ? "border-red-600/60" : "border-ink/15",
          // Content styling (Tailwind preflight strips list/heading styles)
          "[&_.tiptap-body_p]:my-1.5",
          "[&_.tiptap-body_h2]:mt-4 [&_.tiptap-body_h2]:mb-1.5 [&_.tiptap-body_h2]:font-display [&_.tiptap-body_h2]:text-xl [&_.tiptap-body_h2]:font-semibold",
          "[&_.tiptap-body_h3]:mt-3 [&_.tiptap-body_h3]:mb-1 [&_.tiptap-body_h3]:font-display [&_.tiptap-body_h3]:text-lg [&_.tiptap-body_h3]:font-semibold",
          "[&_.tiptap-body_ul]:my-2 [&_.tiptap-body_ul]:list-disc [&_.tiptap-body_ul]:pl-5",
          "[&_.tiptap-body_ol]:my-2 [&_.tiptap-body_ol]:list-decimal [&_.tiptap-body_ol]:pl-5",
          "[&_.tiptap-body_blockquote]:my-2 [&_.tiptap-body_blockquote]:border-l-2 [&_.tiptap-body_blockquote]:border-gold [&_.tiptap-body_blockquote]:pl-3 [&_.tiptap-body_blockquote]:text-ink/80",
          "[&_.tiptap-body_a]:text-aegean [&_.tiptap-body_a]:underline",
          "[&_.tiptap-body_img]:my-2 [&_.tiptap-body_img]:max-w-full [&_.tiptap-body_img]:rounded-input",
          // Placeholder (Tiptap adds .is-editor-empty + data-placeholder)
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-stone/70 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        )}
      >
        <div
          role="toolbar"
          aria-label={`${label} formatting`}
          className="flex flex-wrap items-center gap-0.5 border-b border-ink/10 px-1.5 py-1"
        >
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <path d="M11 5h6M7 19h6M14 5l-4 14" />
            </svg>
          </ToolbarButton>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-ink/10" />
          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <span className="block px-0.5 font-display text-[11px] font-bold leading-none">H2</span>
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <span className="block px-0.5 font-display text-[11px] font-bold leading-none">H3</span>
          </ToolbarButton>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-ink/10" />
          <ToolbarButton
            label="Bullet list"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <path d="M10 6h10M10 12h10M10 18h10M4 5.5 5.5 4v4M4 11.5h2.5L4 14.5h2.5M4 17.5h2a1 1 0 0 1 0 2H5h1a1 1 0 0 1 0 2H4" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor?.isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <path d="M9.5 8.5c-2 0-3.5 1.5-3.5 3.5v3.5h4V12H7.8c0-1.2 .8-2 1.7-2zM18 8.5c-2 0-3.5 1.5-3.5 3.5v3.5h4V12h-2.2c0-1.2 .8-2 1.7-2z" />
            </svg>
          </ToolbarButton>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-ink/10" />
          <ToolbarButton
            label={editor?.isActive("link") ? "Edit link" : "Add link"}
            active={editor?.isActive("link") || panel?.mode === "link"}
            onClick={() => (editor ? openLinkPanel(editor) : undefined)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <path d="M10 14a4 4 0 0 0 6 .4l2.5-2.5a4 4 0 1 0-5.7-5.7L11.6 7.4M14 10a4 4 0 0 0-6-.4L5.5 12.1a4 4 0 1 0 5.7 5.7l1.2-1.2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Insert image from URL"
            active={panel?.mode === "image"}
            onClick={() => setPanel({ mode: "image", url: "", alt: "" })}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="m5 19 5.5-5.5 3 3L17 13l4 4" />
            </svg>
          </ToolbarButton>
        </div>

        {panel && (
          <div className="flex flex-wrap items-end gap-2 border-b border-ink/10 bg-white/60 px-3 py-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${id}-panel-url`} className="mb-1 block text-[11px] font-medium text-stone">
                {panel.mode === "link" ? "Link URL (empty removes the link)" : "Image URL"}
              </label>
              <input
                id={`${id}-panel-url`}
                type="text"
                value={panel.url}
                autoFocus
                onChange={(e) => setPanel({ ...panel, url: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPanel();
                  }
                  if (e.key === "Escape") setPanel(null);
                }}
                placeholder={panel.mode === "link" ? "https://… or /portfolio" : "/api/media/… or https://…"}
                className="w-full rounded-input border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink focus:shadow-[inset_0_-2px_0_0_var(--gold)]"
              />
            </div>
            {panel.mode === "image" && (
              <div className="min-w-0 flex-1">
                <label htmlFor={`${id}-panel-alt`} className="mb-1 block text-[11px] font-medium text-stone">
                  Alt text
                </label>
                <input
                  id={`${id}-panel-alt`}
                  type="text"
                  value={panel.alt}
                  onChange={(e) => setPanel({ ...panel, alt: e.target.value })}
                  className="w-full rounded-input border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink focus:shadow-[inset_0_-2px_0_0_var(--gold)]"
                />
              </div>
            )}
            <div className="flex gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={applyPanel}
                className="rounded-input bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="rounded-input border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </FieldShell>
  );
}
