import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "a",
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "blockquote",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "class",
];

const HEADING_MAX_LENGTH = 120;
const BULLET_PATTERN = /^[\s]*(?:[•\-\*·▪◦‣–—]|\d+[.)])\s+(.+)$/;
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*?>/i;
const BLOCK_TAG_PATTERN = /<(p|h2|h3|ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi;

export function stripHtmlTags(value: string) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isHtmlArticleContent(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

function normalizePlainTextNewlines(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function looksLikeHeading(line: string) {
  const text = line.trim();
  if (!text || text.length > HEADING_MAX_LENGTH) return false;
  if (/[.!?]["']?$/.test(text)) return false;
  if (BULLET_PATTERN.test(text)) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  const titleCaseWords = words.filter((word) =>
    /^[A-Z][a-zA-Z0-9'’\-]*$/.test(word) || /^[A-Z]{2,}$/.test(word),
  ).length;

  if (titleCaseWords >= Math.max(2, Math.ceil(words.length * 0.75))) {
    return true;
  }

  if (text.length <= 72 && /^[A-Z]/.test(text)) {
    return true;
  }

  return false;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapParagraph(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isHtmlArticleContent(trimmed)) return trimmed;
  return `<p>${escapeHtml(trimmed)}</p>`;
}

function wrapEmptyParagraph() {
  return "<p><br></p>";
}

function wrapHeading(text: string, level: "h2" | "h3" = "h2") {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return `<${level}>${escapeHtml(trimmed)}</${level}>`;
}

function linesToListHtml(lines: string[], ordered: boolean) {
  const tag = ordered ? "ol" : "ul";
  const items = lines
    .map((line) => {
      const match = line.match(BULLET_PATTERN);
      const item = match ? match[1].trim() : line.trim();
      return item ? `<li>${escapeHtml(item)}</li>` : "";
    })
    .filter(Boolean)
    .join("");
  return items ? `<${tag}>${items}</${tag}>` : "";
}

function isOrderedListBlock(lines: string[]) {
  return lines.length > 0 && lines.every((line) => /^\s*\d+[.)]\s+/.test(line));
}

function plainBlockToHtml(block: string) {
  const lines = normalizePlainTextNewlines(block)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return "";

  const bulletLines = lines.filter((line) => BULLET_PATTERN.test(line));
  if (bulletLines.length === lines.length) {
    return linesToListHtml(lines, isOrderedListBlock(lines));
  }

  if (lines.length === 1) {
    return looksLikeHeading(lines[0])
      ? wrapHeading(lines[0])
      : wrapParagraph(lines[0]);
  }

  const parts: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (BULLET_PATTERN.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length && BULLET_PATTERN.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }
      parts.push(linesToListHtml(listLines, isOrderedListBlock(listLines)));
      continue;
    }

    if (looksLikeHeading(line)) {
      parts.push(wrapHeading(line));
      index += 1;
      continue;
    }

    parts.push(wrapParagraph(line));
    index += 1;
  }

  return parts.join("");
}

/** Convert legacy plain-text article bodies into safe HTML. */
export function plainTextToArticleHtml(value: string) {
  const normalized = normalizePlainTextNewlines(value);
  if (!normalized) return "";

  const chunks = normalized.split(/(\n{2,})/);
  const html = chunks
    .map((chunk) => {
      if (!chunk) return "";
      if (/^\n{2,}$/.test(chunk)) {
        const blankCount = Math.max(1, chunk.length - 1);
        return Array.from({ length: blankCount }, () => wrapEmptyParagraph()).join("");
      }
      return plainBlockToHtml(chunk);
    })
    .join("");

  return sanitizeArticleHtml(normalizeBlockHtml(html));
}

/** Remove Word-specific markup before sanitizing pasted HTML. */
export function cleanWordHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:html|head|body|meta|link|title|xml)[^>]*>/gi, "")
    .replace(/<(\/?)(?:o|w|v|m):[^>]*>/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, "$1")
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/gi, "<li>$1</li>")
    .replace(/<h1([^>]*)>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/<h[4-6]([^>]*)>/gi, "<h3$1>")
    .replace(/<\/h[4-6]>/gi, "</h3>");
}

function convertDivsToParagraphs(html: string) {
  return html
    .replace(/<div\b[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, "")
    .replace(/<div\b[^>]*>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>");
}

function splitParagraphsOnBreaks(html: string) {
  return html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (match, inner: string) => {
    const segments = inner.split(/<br\s*\/?>/gi).map((segment) => segment.trim());

    if (segments.length <= 1) return match;

    return segments
      .map((segment) => (segment ? `<p>${segment}</p>` : wrapEmptyParagraph()))
      .join("");
  });
}

function promoteBoldParagraphsToHeadings(html: string) {
  return html.replace(
    /<p\b[^>]*>\s*(?:<(?:strong|b)>)([\s\S]*?)(?:<\/(?:strong|b)>)\s*<\/p>/gi,
    (match, inner: string) => {
      const plain = stripHtmlTags(inner);
      return looksLikeHeading(plain) ? wrapHeading(plain) : match;
    },
  );
}

function promoteStandaloneParagraphHeadings(html: string) {
  return html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (match, inner: string) => {
    const plain = stripHtmlTags(inner);
    if (!plain || inner.trim() !== plain) return match;
    return looksLikeHeading(plain) ? wrapHeading(plain) : match;
  });
}

function extractHtmlBlocks(html: string) {
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(BLOCK_TAG_PATTERN.source, "gi");

  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[0]);
  }

  return blocks;
}

function paragraphPlainText(block: string) {
  return stripHtmlTags(block.replace(/<\/?p[^>]*>/gi, " "));
}

function mergeBulletParagraphsIntoLists(html: string) {
  const blocks = extractHtmlBlocks(html);
  if (!blocks.length) return html;

  const output: string[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];
    const plain = paragraphPlainText(block);

    if (/^<p\b/i.test(block) && BULLET_PATTERN.test(plain)) {
      const listLines: string[] = [];
      while (index < blocks.length) {
        const current = blocks[index];
        const currentPlain = paragraphPlainText(current);
        if (!/^<p\b/i.test(current) || !BULLET_PATTERN.test(currentPlain)) break;
        listLines.push(currentPlain);
        index += 1;
      }
      output.push(linesToListHtml(listLines, isOrderedListBlock(listLines)));
      continue;
    }

    output.push(block);
    index += 1;
  }

  return output.join("");
}

/** Normalize pasted or edited HTML into semantic article blocks. */
export function normalizeBlockHtml(html: string) {
  if (!html.trim()) return "";

  let result = cleanWordHtml(html);
  result = convertDivsToParagraphs(result);
  result = splitParagraphsOnBreaks(result);
  result = promoteBoldParagraphsToHeadings(result);
  result = promoteStandaloneParagraphHeadings(result);
  result = mergeBulletParagraphsIntoLists(result);

  return result.trim();
}

export function sanitizeArticleHtml(html: string) {
  const cleaned = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ALLOWED_ATTR,
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: true,
    nonTextTags: [
      "style",
      "script",
      "textarea",
      "option",
      "noscript",
      "iframe",
      "object",
      "embed",
    ],
    transformTags: {
      a: (_tagName, attribs) => {
        const isExternalLink = /^(?:https?:)?\/\//i.test(attribs.href ?? "");
        const opensNewTab = attribs.target?.toLowerCase() === "_blank";

        if (isExternalLink && opensNewTab) {
          const relValues = new Set(
            (attribs.rel ?? "").split(/\s+/).filter(Boolean),
          );
          relValues.add("noopener");
          relValues.add("noreferrer");
          attribs.rel = Array.from(relValues).join(" ");
        }

        return { tagName: "a", attribs };
      },
    },
  })
    .replace(/<p>\s*<\/p>/g, "<p><br></p>")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .trim();

  return cleaned;
}

function formatArticleHtml(rawHtml: string) {
  const structured = normalizeBlockHtml(rawHtml);
  return sanitizeArticleHtml(structured);
}

function countHtmlBlocks(html: string) {
  return (html.match(/<(p|h2|h3|ul|ol)\b/gi) || []).length;
}

/** Choose the paste conversion that preserves the most structure. */
export function pasteClipboardToArticleHtml(html: string, plain: string) {
  const trimmedHtml = html.replace(/<!--[\s\S]*?-->/g, "").trim();
  const fromPlain = plainTextToArticleHtml(plain);

  if (!trimmedHtml) return fromPlain;

  const fromHtml = formatArticleHtml(trimmedHtml);
  const plainBlocks = countHtmlBlocks(fromPlain);
  const htmlBlocks = countHtmlBlocks(fromHtml);

  if (plainBlocks > htmlBlocks) return fromPlain;
  return fromHtml;
}

export function prepareArticleContentForSave(raw: unknown) {
  if (typeof raw !== "string") {
    return { ok: false as const, error: "Article content is required." };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Content is required." };
  }

  const html = isHtmlArticleContent(trimmed)
    ? formatArticleHtml(trimmed)
    : plainTextToArticleHtml(trimmed);

  const textLength = stripHtmlTags(html).length;
  if (textLength < 50) {
    return { ok: false as const, error: "Article content must be at least 50 characters." };
  }

  if (html.length > 500_000) {
    return { ok: false as const, error: "Article content is too long." };
  }

  return { ok: true as const, value: html };
}

export function prepareArticleContentForDisplay(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";

  const html = isHtmlArticleContent(trimmed)
    ? formatArticleHtml(trimmed)
    : plainTextToArticleHtml(trimmed);

  return html;
}

/**
 * Display-only cleanup for older seed/launch articles that were stored with
 * excess blank lines. Does not alter saved content or the admin editor path.
 */
export function collapseLegacyArticleWhitespace(html: string) {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
    .trim();
}

/** Normalize editor HTML on paste or toolbar actions. */
export function normalizeEditorHtml(html: string) {
  if (!html.trim()) return "";
  return formatArticleHtml(html);
}

export function editorHtmlToPlainText(html: string) {
  return stripHtmlTags(html);
}
