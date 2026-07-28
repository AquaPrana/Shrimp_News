"use client";

import { useEffect, useRef, type ClipboardEvent } from "react";
import {
  isHtmlArticleContent,
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
  const hasInitialized = useRef(false);
  const savedSelection = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!hasInitialized.current) {
      editor.innerHTML = toEditorHtml(value);
      lastSyncedValue.current = value;
      hasInitialized.current = true;
      return;
    }

    // The live editor DOM is the source of truth while the user is editing.
    // Parent form renders must never replace it or disturb the caret.
    if (document.activeElement === editor) return;
    if (value === lastSyncedValue.current) return;

    editor.innerHTML = toEditorHtml(value);
    lastSyncedValue.current = value;
  }, [value]);

  useEffect(() => {
    function rememberSelection() {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        savedSelection.current = range.cloneRange();
      }
    }

    document.addEventListener("selectionchange", rememberSelection);
    return () => {
      document.removeEventListener("selectionchange", rememberSelection);
    };
  }, []);

  function syncEditorContent() {
    const editor = editorRef.current;
    if (!editor) return;

    // Never sanitize or replace the DOM during typing. Recognized pasted HTML
    // is cleaned before insertion, and the API performs final cleanup on save.
    const html = editor.innerHTML;
    lastSyncedValue.current = html;
    onChange(html);
  }

  function restoreEditorSelection(editor: HTMLDivElement) {
    editor.focus({ preventScroll: true });

    const selection = window.getSelection();
    const range = savedSelection.current;
    if (!selection || !range || !editor.contains(range.commonAncestorContainer)) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function runFormat(command: FormatCommand) {
    const editor = editorRef.current;
    if (!editor) return;

    restoreEditorSelection(editor);

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

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    if (!editor) return;

    const html = event.clipboardData.getData("text/html");
    const text =
      event.clipboardData.getData("text/plain") ||
      event.clipboardData.getData("text") ||
      event.clipboardData.getData("Text");

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

    if (!inserted) {
      // Some Word, Outlook, PDF, remote-desktop, and browser clipboard paths
      // expose only RTF or another private format. Do not cancel those pastes:
      // let the browser insert its native representation, then sync it. Final
      // sanitization remains part of preview/save instead of moving the caret.
      window.setTimeout(() => {
        syncEditorContent();
      }, 0);
      return;
    }

    event.preventDefault();
    insertHtmlAtCursor(editor, inserted);
    syncEditorContent();
  }

  const toolbarButton =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700";
  const preserveEditorFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("p")}>
          Paragraph
        </button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("h2")}>
          Heading
        </button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("h3")}>
          Subheading
        </button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("bold")}>
          Bold
        </button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("ul")}>
          Bullet list
        </button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("ol")}>
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
        onInput={syncEditorContent}
        onBlur={syncEditorContent}
        onPaste={handlePaste}
        className="article-editor pointer-events-auto min-h-[420px] w-full cursor-text select-text whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs text-slate-500">
        Paste from Word or Google Docs to keep headings, paragraphs, and lists.
        Extra blank lines and Word styles are cleaned automatically.
      </p>
    </div>
  );
}
