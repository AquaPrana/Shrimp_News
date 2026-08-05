"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  isHtmlArticleContent,
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
  const lastEmittedHtml = useRef("");
  const hasInitialized = useRef(false);
  const savedSelection = useRef<Range | null>(null);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || hasInitialized.current) return;

    const initialHtml = toEditorHtml(value);
    editor.innerHTML = initialHtml;
    lastEmittedHtml.current = initialHtml;
    hasInitialized.current = true;

    // The editor is deliberately uncontrolled after this initialization.
    // Add/Edit remount it for a different article, while ordinary form
    // re-renders must never replace live DOM or move the caret.
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

    // Never sanitize or replace the live DOM during typing or paste. Native
    // browser paste stays immediate; Preview and the API perform safe cleanup.
    const html = editor.innerHTML;
    if (html === lastEmittedHtml.current) return;

    lastEmittedHtml.current = html;
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
        onFocus={() => {
          const editor = editorRef.current;
          const selection = window.getSelection();
          if (!editor || !selection || selection.rangeCount === 0) return;

          const range = selection.getRangeAt(0);
          if (editor.contains(range.commonAncestorContainer)) {
            savedSelection.current = range.cloneRange();
          }
        }}
        className="article-editor pointer-events-auto min-h-[420px] w-full cursor-text select-text whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs text-slate-500">
        Paste from Word or Google Docs to keep headings, paragraphs, and lists.
        Word-only styles are cleaned safely when you preview or save.
      </p>
    </div>
  );
}
