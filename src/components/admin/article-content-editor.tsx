"use client";

import { useEffect, useRef, type ClipboardEvent } from "react";
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

function insertHtmlAtCursor(editor: HTMLDivElement, html: string) {
  editor.focus();

  const selection = window.getSelection();
  if (!selection) {
    editor.insertAdjacentHTML("beforeend", html);
    return;
  }

  if (selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function ArticleContentEditor({
  value,
  onChange,
  className = "",
}: ArticleContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncedValue = useRef<string | null>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Never clobber the live editor while the user is typing/pasting.
    if (document.activeElement === editor || isInternalUpdate.current) {
      lastSyncedValue.current = value;
      return;
    }

    if (value === lastSyncedValue.current) return;

    const html = toEditorHtml(value);
    editor.innerHTML = html;
    lastSyncedValue.current = value;
  }, [value]);

  function syncEditorContent(options?: { sanitize?: boolean }) {
    const editor = editorRef.current;
    if (!editor) return;

    const shouldSanitize = options?.sanitize !== false;
    // Typing: keep live DOM as source of truth. Paste/blur: full sanitize.
    const displayHtml = shouldSanitize
      ? toEditorHtml(normalizeEditorHtml(editor.innerHTML)) ||
        normalizeEditorHtml(editor.innerHTML)
      : editor.innerHTML;

    isInternalUpdate.current = true;
    lastSyncedValue.current = displayHtml;
    onChange(displayHtml);
    queueMicrotask(() => {
      isInternalUpdate.current = false;
    });
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

    syncEditorContent({ sanitize: true });
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    if (!editor) return;

    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");

    // Always handle paste ourselves so Word/Docs markup is sanitized,
    // but never leave the editor empty when clipboard text exists.
    event.preventDefault();

    let inserted = pasteClipboardToArticleHtml(html, text);
    if (!inserted && text.trim()) {
      inserted = plainTextToArticleHtml(text);
    }
    if (!inserted && text.trim()) {
      // Last resort: escape plain text into paragraphs so paste still works.
      inserted = text
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map(
          (block) =>
            `<p>${block
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br>")}</p>`,
        )
        .join("");
    }

    if (!inserted) return;

    insertHtmlAtCursor(editor, inserted);
    syncEditorContent({ sanitize: true });
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
        contentEditable={true}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Complete article content"
        tabIndex={0}
        onInput={() => syncEditorContent({ sanitize: false })}
        onBlur={() => syncEditorContent({ sanitize: true })}
        onPaste={handlePaste}
        className="article-editor article-content min-h-[420px] w-full select-text rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs text-slate-500">
        Paste from Word or Google Docs to keep headings, paragraphs, and lists.
        Extra blank lines and Word styles are cleaned automatically.
      </p>
    </div>
  );
}
