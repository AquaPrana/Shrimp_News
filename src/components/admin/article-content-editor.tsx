"use client";

import { useEffect, useRef } from "react";
import {
  isHtmlArticleContent,
  normalizeEditorHtml,
  pasteClipboardToArticleHtml,
  plainTextToArticleHtml,
  prepareArticleContentForDisplay,
} from "@/lib/article-content";

type ArticleContentEditorProps = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
};

type FormatCommand = "bold" | "h2" | "h3" | "p" | "ul" | "ol";

function toEditorHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return isHtmlArticleContent(trimmed)
    ? prepareArticleContentForDisplay(trimmed)
    : plainTextToArticleHtml(trimmed);
}

export function ArticleContentEditor({
  value,
  onChange,
  className = "",
}: ArticleContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncedValue = useRef(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (value === lastSyncedValue.current) return;

    const html = toEditorHtml(value);
    editor.innerHTML = html;
    lastSyncedValue.current = value;
  }, [value]);

  function syncEditorContent() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = normalizeEditorHtml(editor.innerHTML);
    lastSyncedValue.current = html;
    onChange(html);
  }

  function runFormat(command: FormatCommand) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    if (command === "bold") {
      document.execCommand("bold");
    } else if (command === "ul") {
      document.execCommand("insertUnorderedList");
    } else if (command === "ol") {
      document.execCommand("insertOrderedList");
    } else if (command === "p") {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, command);
    }

    syncEditorContent();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");

    const inserted = pasteClipboardToArticleHtml(html, text);

    if (inserted) {
      document.execCommand("insertHTML", false, inserted);
      syncEditorContent();
    }
  }

  const toolbarButton =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700";

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" className={toolbarButton} onClick={() => runFormat("p")}>
          Paragraph
        </button>
        <button type="button" className={toolbarButton} onClick={() => runFormat("h2")}>
          Heading
        </button>
        <button type="button" className={toolbarButton} onClick={() => runFormat("h3")}>
          Subheading
        </button>
        <button type="button" className={toolbarButton} onClick={() => runFormat("bold")}>
          Bold
        </button>
        <button type="button" className={toolbarButton} onClick={() => runFormat("ul")}>
          Bullet list
        </button>
        <button type="button" className={toolbarButton} onClick={() => runFormat("ol")}>
          Numbered list
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Complete article content"
        onInput={syncEditorContent}
        onBlur={syncEditorContent}
        onPaste={handlePaste}
        className="article-editor min-h-[420px] w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs text-slate-500">
        Paste from Word to keep headings, paragraphs, and bullet lists. Use the
        toolbar to adjust formatting.
      </p>
    </div>
  );
}
