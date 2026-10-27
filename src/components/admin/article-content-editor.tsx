"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
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

type BlockFormat = "p" | "h2" | "h3" | "h4" | "blockquote";

type FormatCommand =
  | BlockFormat
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "ul"
  | "ol"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull"
  | "link"
  | "unlink"
  | "hr"
  | "removeFormat"
  | "undo"
  | "redo";

const BLOCK_OPTIONS: { value: BlockFormat; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h2", label: "Heading" },
  { value: "h3", label: "Subheading" },
  { value: "h4", label: "Small heading" },
  { value: "blockquote", label: "Quote" },
];

// execCommand fontSize levels map to CSS keywords the sanitizer allows.
const FONT_SIZE_OPTIONS = [
  { value: "2", label: "Small" },
  { value: "3", label: "Normal" },
  { value: "4", label: "Large" },
  { value: "5", label: "Extra large" },
  { value: "6", label: "Huge" },
];

const TEXT_COLORS = [
  "#0f172a",
  "#475569",
  "#0b4f7a",
  "#0e7490",
  "#15803d",
  "#b45309",
  "#c2410c",
  "#b91c1c",
  "#7e22ce",
];

const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bae6fd", "#fecaca", "#e9d5ff"];

const STATE_COMMANDS = [
  "bold",
  "italic",
  "underline",
  "strikeThrough",
  "insertUnorderedList",
  "insertOrderedList",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "justifyFull",
] as const;

type ActiveState = Partial<Record<(typeof STATE_COMMANDS)[number], boolean>> & {
  block?: BlockFormat;
};

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

const TOP_LEVEL_BLOCKS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "BLOCKQUOTE",
  "DIV",
  "HR",
  "TABLE",
  "IMG",
]);

/**
 * Typing into an empty editor leaves bare text at the top level. Wrap those
 * runs in paragraphs on a detached copy so saved HTML always has real blocks
 * without moving the admin's caret.
 */
function editorHtmlWithParagraphs(editor: HTMLDivElement) {
  const copy = editor.cloneNode(true) as HTMLDivElement;
  let run: Node[] = [];
  const flush = (before: Node | null) => {
    const hasText = run.some((node) => node.textContent?.trim());
    if (hasText) {
      const paragraph = document.createElement("p");
      copy.insertBefore(paragraph, before);
      run.forEach((node) => paragraph.append(node));
    }
    run = [];
  };

  for (const node of Array.from(copy.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && TOP_LEVEL_BLOCKS.has((node as Element).tagName)) {
      flush(node);
    } else {
      run.push(node);
    }
  }
  flush(null);
  return copy.innerHTML;
}

/** Turn browser-created line breaks inside one list item into separate items. */
function splitSelectedListLines(
  editor: HTMLDivElement,
  tagName: "ul" | "ol",
) {
  const selection = editor.ownerDocument.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!selection || !rangeInsideEditor(editor, range)) return;

  let lastItem: HTMLLIElement | null = null;
  const lists = Array.from(editor.querySelectorAll(tagName)).filter((list) => {
    try {
      return range!.intersectsNode(list);
    } catch {
      return false;
    }
  });

  for (const list of lists) {
    const items = Array.from(list.children).filter(
      (child): child is HTMLLIElement => child.tagName === "LI",
    );
    for (const item of items) {
      if (!item.querySelector("br")) continue;
      const parts = item.innerHTML
        .split(/<br\s*\/?>/gi)
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length < 2) continue;

      const fragment = editor.ownerDocument.createDocumentFragment();
      for (const part of parts) {
        const nextItem = editor.ownerDocument.createElement("li");
        nextItem.innerHTML = part;
        fragment.append(nextItem);
        lastItem = nextItem;
      }
      item.replaceWith(fragment);
    }
  }

  if (!lastItem) return;
  const caret = editor.ownerDocument.createRange();
  caret.selectNodeContents(lastItem);
  caret.collapse(false);
  selection.removeAllRanges();
  selection.addRange(caret);
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

function normalizeLinkUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(?:https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

/** Run a command that should emit inline CSS (colour, size, alignment). */
function execWithCss(command: string, value?: string) {
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand(command, false, value);
  document.execCommand("styleWithCSS", false, "false");
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
  const [active, setActive] = useState<ActiveState>({});

  useImperativeHandle(forwardedRef, () => ({
    getHtml: () =>
      editorRef.current ? editorHtmlWithParagraphs(editorRef.current) : initialContent,
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

  const refreshActiveState = useCallback(() => {
    const next: ActiveState = {};
    for (const command of STATE_COMMANDS) {
      try {
        next[command] = document.queryCommandState(command);
      } catch {
        next[command] = false;
      }
    }
    const block = String(document.queryCommandValue("formatBlock") || "p")
      .replace(/[<>]/g, "")
      .toLowerCase();
    next.block = BLOCK_OPTIONS.some((option) => option.value === block)
      ? (block as BlockFormat)
      : "p";
    setActive(next);
  }, []);

  useEffect(() => {
    function rememberSelection() {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (rangeInsideEditor(editor, range)) {
        savedSelection.current = range.cloneRange();
        refreshActiveState();
      }
    }

    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, [refreshActiveState]);

  function emitCurrentContent() {
    const editor = editorRef.current;
    if (!editor || isComposing.current) return;
    isDirty.current = false;
    onContentChange?.(editorHtmlWithParagraphs(editor));
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

  function applyBlockFormat(editor: HTMLDivElement, command: BlockFormat) {
    // Chromium accepts bare tag names while Firefox expects angle brackets.
    // Trying both keeps the existing native editing behavior (including list,
    // undo, selection, and caret handling) without rebuilding editor HTML.
    const formatted = document.execCommand(
      "formatBlock",
      false,
      `<${command}>`,
    );
    if (!formatted) document.execCommand("formatBlock", false, command);

    // Preserve an explicit Paragraph choice through the paste normalizer,
    // which otherwise promotes title-cased paragraphs to headings.
    // The temporary attribute is stripped by sanitize-html before storage.
    if (command === "p") {
      const activeSelection = window.getSelection();
      const activeRange = activeSelection?.rangeCount
        ? activeSelection.getRangeAt(0)
        : null;
      if (rangeInsideEditor(editor, activeRange)) {
        editor.querySelectorAll("p").forEach((paragraph) => {
          try {
            if (activeRange!.intersectsNode(paragraph)) {
              paragraph.setAttribute(
                "data-article-explicit-paragraph",
                "true",
              );
            }
          } catch {
            // Detached nodes can disappear while formatBlock is completing.
          }
        });
      }
    }
  }

  function runFormat(command: FormatCommand) {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection(editor);
    document.execCommand("defaultParagraphSeparator", false, "p");

    if (command === "bold") document.execCommand("bold");
    else if (command === "italic") document.execCommand("italic");
    else if (command === "underline") document.execCommand("underline");
    else if (command === "strikeThrough") document.execCommand("strikeThrough");
    else if (command === "ul") {
      document.execCommand("insertUnorderedList");
      splitSelectedListLines(editor, "ul");
    } else if (command === "ol") {
      document.execCommand("insertOrderedList");
      splitSelectedListLines(editor, "ol");
    } else if (
      command === "justifyLeft" ||
      command === "justifyCenter" ||
      command === "justifyRight" ||
      command === "justifyFull"
    ) execWithCss(command);
    else if (command === "link") {
      const selection = window.getSelection();
      const hasText = Boolean(selection && !selection.isCollapsed);
      const entered = window.prompt("Link URL (https://…)", "https://");
      if (entered === null) return;
      const url = normalizeLinkUrl(entered);
      if (!url) {
        window.alert("Please enter a valid web address, e.g. https://example.com");
        return;
      }
      restoreSelection(editor);
      if (hasText) document.execCommand("createLink", false, url);
      else document.execCommand("insertHTML", false, `<a href="${url.replace(/"/g, "&quot;")}">${url.replace(/</g, "&lt;")}</a>`);
    } else if (command === "unlink") document.execCommand("unlink");
    else if (command === "hr") document.execCommand("insertHorizontalRule");
    else if (command === "removeFormat") {
      document.execCommand("removeFormat");
      document.execCommand("unlink");
    } else if (command === "undo") document.execCommand("undo");
    else if (command === "redo") document.execCommand("redo");
    else applyBlockFormat(editor, command);

    const selection = window.getSelection();
    if (selection?.rangeCount && rangeInsideEditor(editor, selection.getRangeAt(0))) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
    }
    isDirty.current = true;
    emitCurrentContent();
    refreshActiveState();
  }

  function runStyle(command: "foreColor" | "hiliteColor" | "fontSize", value: string) {
    const editor = editorRef.current;
    if (!editor) return;
    restoreSelection(editor);
    if (command === "hiliteColor" && !document.queryCommandSupported("hiliteColor")) {
      execWithCss("backColor", value);
    } else {
      execWithCss(command, value);
    }
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

  const applyToolbarFormat = (
    event: MouseEvent<HTMLButtonElement>,
    command: FormatCommand,
  ) => {
    event.preventDefault();
    runFormat(command);
  };
  const applyKeyboardToolbarFormat = (
    event: MouseEvent<HTMLButtonElement>,
    command: FormatCommand,
  ) => {
    if (event.detail === 0) runFormat(command);
  };

  const divider = <span aria-hidden className="mx-1 h-6 w-px bg-slate-300" />;
  const icon = "h-4 w-4";
  const selectClass =
    "h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500";

  return (
    <div className={className}>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="sticky top-2 z-10 mt-2 flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-slate-300 bg-slate-50 p-1.5"
      >
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="undo" label="Undo (Ctrl+Z)"><Undo2 className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="redo" label="Redo (Ctrl+Y)"><Redo2 className={icon} /></ToolButton>
        {divider}
        <select
          aria-label="Text style"
          title="Text style"
          value={active.block ?? "p"}
          onMouseDown={() => {
            const editor = editorRef.current;
            const selection = window.getSelection();
            if (editor && selection?.rangeCount && rangeInsideEditor(editor, selection.getRangeAt(0))) {
              savedSelection.current = selection.getRangeAt(0).cloneRange();
            }
          }}
          onChange={(event) => runFormat(event.target.value as BlockFormat)}
          className={selectClass}
        >
          {BLOCK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          aria-label="Font size"
          title="Font size"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) runStyle("fontSize", event.target.value);
            event.target.value = "";
          }}
          className={selectClass}
        >
          <option value="" disabled>Size</option>
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {divider}
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="bold" label="Bold (Ctrl+B)" isActive={active.bold}><Bold className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="italic" label="Italic (Ctrl+I)" isActive={active.italic}><Italic className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="underline" label="Underline (Ctrl+U)" isActive={active.underline}><Underline className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="strikeThrough" label="Strikethrough" isActive={active.strikeThrough}><Strikethrough className={icon} /></ToolButton>
        <ColorMenu
          label="Text colour"
          colors={TEXT_COLORS}
          icon={<span className="text-sm font-bold leading-none underline decoration-[3px] decoration-cyan-600">A</span>}
          onPick={(color) => runStyle("foreColor", color)}
        />
        <ColorMenu
          label="Highlight"
          colors={HIGHLIGHT_COLORS}
          icon={<Highlighter className={icon} />}
          onPick={(color) => runStyle("hiliteColor", color)}
          resetLabel="No highlight"
          onReset={() => runStyle("hiliteColor", "transparent")}
        />
        {divider}
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="justifyLeft" label="Align left" isActive={active.justifyLeft}><AlignLeft className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="justifyCenter" label="Align centre" isActive={active.justifyCenter}><AlignCenter className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="justifyRight" label="Align right" isActive={active.justifyRight}><AlignRight className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="justifyFull" label="Justify" isActive={active.justifyFull}><AlignJustify className={icon} /></ToolButton>
        {divider}
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="ul" label="Bullet list" isActive={active.insertUnorderedList}><List className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="ol" label="Numbered list" isActive={active.insertOrderedList}><ListOrdered className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="link" label="Insert link"><Link className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="unlink" label="Remove link"><Unlink className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="hr" label="Divider line"><Minus className={icon} /></ToolButton>
        <ToolButton onFormat={applyToolbarFormat} onKeyboardFormat={applyKeyboardToolbarFormat} command="removeFormat" label="Clear formatting"><RemoveFormatting className={icon} /></ToolButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Complete article content"
        data-placeholder="Start writing the article, or paste it from Word / Google Docs…"
        tabIndex={0}
        onFocus={(event) => {
          document.execCommand("defaultParagraphSeparator", false, "p");
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
        className="article-editor pointer-events-auto min-h-[420px] w-full cursor-text select-text whitespace-pre-wrap break-words rounded-b-xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal leading-7 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <p className="mt-2 text-xs font-normal text-slate-500">
        Select text, then use the toolbar to change its style, size, colour, alignment, or add links.
        Paste from Word or Google Docs to keep headings, paragraphs, and lists.
      </p>
    </div>
  );
});

type ToolbarHandler = (
  event: MouseEvent<HTMLButtonElement>,
  command: FormatCommand,
) => void;

function ToolButton({
  command,
  label,
  isActive = false,
  onFormat,
  onKeyboardFormat,
  children,
}: {
  command: FormatCommand;
  label: string;
  isActive?: boolean;
  onFormat: ToolbarHandler;
  onKeyboardFormat: ToolbarHandler;
  children: ReactNode;
}) {
  const applyToolbarFormat = onFormat;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-slate-700 transition hover:bg-white hover:text-cyan-700 ${
        isActive ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-200" : ""
      }`}
      onMouseDown={(event) => applyToolbarFormat(event, command)}
      onClick={(event) => onKeyboardFormat(event, command)}
    >
      {children}
    </button>
  );
}

function ColorMenu({
  label,
  colors,
  icon,
  onPick,
  resetLabel,
  onReset,
}: {
  label: string;
  colors: string[];
  icon: ReactNode;
  onPick: (color: string) => void;
  resetLabel?: string;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: globalThis.MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={open}
        // Keep the editor selection while the palette opens.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className="grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-slate-700 transition hover:bg-white hover:text-cyan-700"
      >
        {icon}
      </button>
      {open ? (
        <div className="absolute left-0 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`${label} ${color}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onPick(color);
                  setOpen(false);
                }}
                className="h-6 w-6 rounded-full border border-slate-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {onReset ? (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onReset();
                setOpen(false);
              }}
              className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {resetLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const ArticleContentEditor = memo(ArticleContentEditorImpl);
