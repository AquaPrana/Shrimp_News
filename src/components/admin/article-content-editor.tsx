"use client";

import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type MouseEvent,
} from "react";
import {
  isHtmlArticleContent,
  pasteClipboardToArticleHtml,
  plainTextToArticleHtml,
  prepareArticleContentForDisplay,
} from "@/lib/article-content";

export type ArticleContentEditorHandle = {
  getHtml: () => string;
  focus: () => void;
};

type ArticleContentEditorProps = {
  articleId: string;
  initialContent: string;
  onContentChange?: (html: string) => void;
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

function rangeInsideEditor(editor: HTMLDivElement, range: Range | null) {
  return Boolean(range && editor.contains(range.commonAncestorContainer));
}

function rangeAtEditorEnd(editor: HTMLDivElement) {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  return range;
}

/** Insert an already-sanitized fragment without replacing the editor DOM. */
export function insertArticleHtmlAtRange(
  editor: HTMLDivElement,
  html: string,
  preferredRange: Range | null,
) {
  if (!html.trim()) return null;

  const selection = editor.ownerDocument.getSelection();
  if (!selection) return null;

  const liveRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const range = rangeInsideEditor(editor, liveRange)
    ? liveRange!.cloneRange()
    : rangeInsideEditor(editor, preferredRange)
      ? preferredRange!.cloneRange()
      : rangeAtEditorEnd(editor);

  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;
  if (!lastNode) return null;
  range.insertNode(fragment);

  const caret = document.createRange();
  if (lastNode?.parentNode) caret.setStartAfter(lastNode);
  else caret.selectNodeContents(editor);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);
  return caret.cloneRange();
}

const ArticleContentEditorImpl = forwardRef<
  ArticleContentEditorHandle,
  ArticleContentEditorProps
>(function ArticleContentEditor(
  { articleId, initialContent, onContentChange, className = "" },
  forwardedRef,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initializedArticleId = useRef<string | null>(null);
  const savedSelection = useRef<Range | null>(null);
  const isComposing = useRef(false);
  const isDirty = useRef(false);

  useImperativeHandle(forwardedRef, () => ({
    getHtml: () => editorRef.current?.innerHTML ?? initialContent,
    focus: () => editorRef.current?.focus({ preventScroll: true }),
  }), [initialContent]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || initializedArticleId.current === articleId) return;

    editor.innerHTML = toEditorHtml(initialContent);
    initializedArticleId.current = articleId;
    savedSelection.current = null;
    isDirty.current = false;

    // IMPORTANT: Never sync React state back into innerHTML on input.
    // Replacing editable DOM destroys Selection/Range, causing caret jumps,
    // broken composition, and pasted content disappearing.
  }, [articleId, initialContent]);

  useEffect(() => {
    function rememberSelection() {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (rangeInsideEditor(editor, range)) savedSelection.current = range.cloneRange();
    }

    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  function emitCurrentContent() {
    const editor = editorRef.current;
    if (!editor || isComposing.current) return;
    isDirty.current = false;
    onContentChange?.(editor.innerHTML);
  }

  function restoreSelection(editor: HTMLDivElement) {
    editor.focus({ preventScroll: true });
    const selection = window.getSelection();
    const range = savedSelection.current;
    if (!selection || !rangeInsideEditor(editor, range)) return;
    try {
      selection.removeAllRanges();
      selection.addRange(range!);
    } catch (error) {
      console.warn("Article editor could not restore the saved selection.", error);
    }
  }

  function runFormat(command: FormatCommand) {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection(editor);

    if (command === "bold") document.execCommand("bold");
    else if (command === "ul") document.execCommand("insertUnorderedList");
    else if (command === "ol") document.execCommand("insertOrderedList");
    else document.execCommand("formatBlock", false, command);

    const selection = window.getSelection();
    if (selection?.rangeCount && rangeInsideEditor(editor, selection.getRangeAt(0))) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
    }
    isDirty.current = true;
    emitCurrentContent();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const editor = event.currentTarget;
    if (!editor) return;

    const clipboard = event.clipboardData;
    const html = clipboard.getData("text/html");
    const plain = clipboard.getData("text/plain") || clipboard.getData("text") || clipboard.getData("Text");

    try {
      let safeHtml = pasteClipboardToArticleHtml(html, plain);
      if (!safeHtml && plain) safeHtml = plainTextToArticleHtml(plain);

      // Unknown/private clipboard formats are left to the browser. The editor
      // still reads the resulting DOM on Preview/Save, so content is not lost.
      if (!safeHtml) return;

      const insertedCaret = insertArticleHtmlAtRange(
        editor,
        safeHtml,
        savedSelection.current,
      );
      // Cancel native paste only after custom insertion definitely succeeded.
      // If selection or insertion fails, the same first event remains available
      // to Chromium's native contentEditable paste behavior.
      if (!insertedCaret) return;
      event.preventDefault();
      savedSelection.current = insertedCaret;
      isDirty.current = true;
      emitCurrentContent();
    } catch (error) {
      console.error("Article paste sanitization failed; using safe plain text.", error);
      if (!plain) return;
      try {
        const fallback = plainTextToArticleHtml(plain);
        const insertedCaret = insertArticleHtmlAtRange(
          editor,
          fallback,
          savedSelection.current,
        );
        if (!insertedCaret) return;
        event.preventDefault();
        savedSelection.current = insertedCaret;
        isDirty.current = true;
        emitCurrentContent();
      } catch (fallbackError) {
        console.error("Article plain-text paste fallback failed.", fallbackError);
      }
    }
  }

  const toolbarButton =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700";
  const preserveEditorFocus = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("p")}>Paragraph</button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("h2")}>Heading</button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("h3")}>Subheading</button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("bold")}>Bold</button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("ul")}>Bullet list</button>
        <button type="button" className={toolbarButton} onMouseDown={preserveEditorFocus} onClick={() => runFormat("ol")}>Numbered list</button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Complete article content"
        tabIndex={0}
        onFocus={(event) => {
          const editor = event.currentTarget;
          const selection = editor.ownerDocument.getSelection();
          const liveRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
          if (!selection || rangeInsideEditor(editor, liveRange)) return;

          const caret = rangeAtEditorEnd(editor);
          selection.removeAllRanges();
          selection.addRange(caret);
          savedSelection.current = caret.cloneRange();
        }}
        onInput={() => { isDirty.current = true; }}
        onBlur={() => { if (isDirty.current) emitCurrentContent(); }}
        onPaste={handlePaste}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => { isComposing.current = false; isDirty.current = true; }}
        className="article-editor pointer-events-auto min-h-[420px] w-full cursor-text select-text whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs text-slate-500">
        Paste from Word or Google Docs to keep headings, paragraphs, and lists.
        Word-only styles are cleaned safely when you paste, preview, or save.
      </p>
    </div>
  );
});

export const ArticleContentEditor = memo(ArticleContentEditorImpl);
