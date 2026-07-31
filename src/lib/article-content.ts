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

const HEADING_MAX_LENGTH = 120;
const BULLET_PATTERN = /^[\s]*(?:[•\-\*·▪◦‣–—]|\d+[.)])\s+(.+)$/;
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*?>/i;
const BLOCK_TAG_PATTERN =
  /<(p|h2|h3|ul|ol|blockquote|table)\b[^>]*>[\s\S]*?<\/\1>/gi;

export function stripHtmlTags(value: string) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
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
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeHeading(line: string) {
  const text = line.trim();
  if (!text || text.length > HEADING_MAX_LENGTH) return false;
  if (/[.!?]["']?$/.test(text)) return false;
  if (BULLET_PATTERN.test(text)) return false;
  // Single short words / sentence fragments are not headings.
  if (text.length < 12) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 12) return false;

  const titleCaseWords = words.filter(
    (word) =>
      /^[A-Z][a-zA-Z0-9'’\-]*$/.test(word) || /^[A-Z]{2,}$/.test(word),
  ).length;

  // Require most words to look title-case / ALL-CAPS — not merely starting with a capital.
  return titleCaseWords >= Math.max(2, Math.ceil(words.length * 0.75));
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
export function plainTextToArticleHtml(value: string): string {
  const normalized = normalizePlainTextNewlines(value);
  if (!normalized) return "";

  // Split on blank lines into paragraphs — never emit empty spacer paragraphs.
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => plainBlockToHtml(block))
    .filter(Boolean);

  return sanitizeArticleHtml(blocks.join(""));
}

/** Remove Word / Docs / office-specific markup before sanitizing pasted HTML. */
export function cleanWordHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:html|head|body|meta|link|title|xml|o:p)[^>]*>/gi, "")
    .replace(/<(\/?)(?:o|w|v|m):[^>]*>/gi, "")
    .replace(/<\/?o:p[^>]*>/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sdir="[^"]*"/gi, "")
    .replace(/\slang="[^"]*"/gi, "")
    .replace(/\sid="[^"]*"/gi, "")
    .replace(/<\/?font\b[^>]*>/gi, "")
    .replace(/<span\b[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match, inner: string) => {
      const content = inner
        .replace(/<\/?(?:p|div)\b[^>]*>/gi, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      return content ? `<li>${content}</li>` : "";
    })
    .replace(/<h1\b([^>]*)>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/<h[4-6]\b([^>]*)>/gi, "<h3$1>")
    .replace(/<\/h[4-6]>/gi, "</h3>");
}

function convertDivsToParagraphs(html: string) {
  return html
    .replace(/<div\b[^>]*>\s*(?:&nbsp;|\u00a0|<br\s*\/?>|\s)*<\/div>/gi, "")
    .replace(/<div\b[^>]*>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>");
}

function splitParagraphsOnBreaks(html: string) {
  return html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_match, inner: string) => {
    const segments = inner
      .split(/<br\s*\/?>/gi)
      .map((segment: string) => segment.trim())
      .filter((segment: string) => stripHtmlTags(segment).length > 0);

    if (segments.length === 0) return "";
    if (segments.length === 1 && !/<br\s*\/?>/i.test(inner)) {
      return `<p>${inner.trim()}</p>`;
    }

    return segments.map((segment: string) => `<p>${segment}</p>`).join("");
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

/**
 * Remove empty blocks, collapse excessive breaks, and strip spacer paragraphs
 * that create large blank gaps after Word/Docs paste.
 */
export function collapseEmptyAndSpacerBlocks(html: string) {
  let result = html
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    // Empty or whitespace-only paragraphs / headings / spans / divs / list items
    .replace(
      /<(p|h[1-6]|div|span|li)\b[^>]*>\s*(?:&nbsp;|\u00a0|<br\s*\/?>|\s)*<\/\1>/gi,
      "",
    )
    // Paragraphs that only contain invisible characters after stripping tags
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (match, inner: string) => {
      return stripHtmlTags(inner) ? match : "";
    })
    // Collapse 2+ consecutive <br> into a paragraph boundary (spacing via CSS)
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, "</p><p>")
    // Lone trailing/leading breaks inside paragraphs
    .replace(/<p\b([^>]*)>(?:\s*<br\s*\/?>)+/gi, "<p$1>")
    .replace(/(?:<br\s*\/?>\s*)+<\/p>/gi, "</p>")
    // Fix accidental empty paragraphs created by br collapse
    .replace(
      /<(p|h[1-6]|div|li)\b[^>]*>\s*(?:&nbsp;|\u00a0|<br\s*\/?>|\s)*<\/\1>/gi,
      "",
    )
    // Empty lists
    .replace(/<(ul|ol)\b[^>]*>\s*<\/\1>/gi, "")
    // Collapse runs of whitespace between tags (keep a single space where needed)
    .replace(/>\s{2,}</g, "> <")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Drop consecutive empty leftovers once more
  result = result.replace(
    /(?:<(?:p|div)\b[^>]*>\s*(?:&nbsp;|\u00a0|<br\s*\/?>|\s)*<\/(?:p|div)>\s*)+/gi,
    "",
  );

  // Remove leading/trailing empty paragraphs after cleanup
  result = result
    .replace(/^(?:\s*<p\b[^>]*>\s*<\/p>)+/i, "")
    .replace(/(?:<p\b[^>]*>\s*<\/p>\s*)+$/i, "")
    .trim();

  return result;
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
  result = collapseEmptyAndSpacerBlocks(result);

  return result.trim();
}

export function sanitizeArticleHtml(html: string) {
  const cleaned = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height"],
      table: [],
      thead: [],
      tbody: [],
      tr: [],
      th: [],
      td: [],
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
  });

  return collapseEmptyAndSpacerBlocks(cleaned).trim();
}

/**
 * Primary sanitizer used before save and on display.
 * Cleans Word/Docs paste artifacts while preserving structure.
 */
export function sanitizeArticleContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";

  if (!isHtmlArticleContent(trimmed)) {
    return plainTextToArticleHtml(trimmed);
  }

  const structured = normalizeBlockHtml(trimmed);
  return sanitizeArticleHtml(structured);
}

function formatArticleHtml(rawHtml: string) {
  return sanitizeArticleContent(rawHtml);
}

function countHtmlBlocks(html: string) {
  return (html.match(/<(p|h2|h3|ul|ol)\b/gi) || []).length;
}

/** Choose the paste conversion that preserves the most structure. */
export function pasteClipboardToArticleHtml(html: string, plain: string) {
  const trimmedHtml = html.replace(/<!--[\s\S]*?-->/g, "").trim();
  const fromPlain = plainTextToArticleHtml(plain);

  if (!trimmedHtml) return fromPlain;

  try {
    const fromHtml = formatArticleHtml(trimmedHtml);
    const plainBlocks = countHtmlBlocks(fromPlain);
    const htmlBlocks = countHtmlBlocks(fromHtml);

    // Prefer HTML paste when it has real structure; otherwise plain text path.
    if (htmlBlocks === 0) return fromPlain;
    if (fromPlain && plainBlocks > htmlBlocks * 1.5) return fromPlain;
    return fromHtml || fromPlain;
  } catch {
    return fromPlain;
  }
}

export function prepareArticleContentForSave(raw: unknown) {
  if (typeof raw !== "string") {
    return { ok: false as const, error: "Article content is required." };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Content is required." };
  }

  const html = sanitizeArticleContent(trimmed);

  const textLength = stripHtmlTags(html).length;
  if (textLength < 50) {
    return {
      ok: false as const,
      error: "Article content must be at least 50 characters.",
    };
  }

  if (html.length > 500_000) {
    return { ok: false as const, error: "Article content is too long." };
  }

  return { ok: true as const, value: html };
}

export function prepareArticleContentForDisplay(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";

  // Captions are intentionally omitted from public article bodies. Remove them
  // before sanitizing so sanitize-html cannot preserve their descriptive text
  // after stripping the unsupported figcaption element.
  const withoutImageCaptions = trimmed.replace(
    /<figcaption\b[^>]*>[\s\S]*?<\/figcaption\s*>/gi,
    "",
  );

  // Always re-clean on render so older articles with spacer HTML display correctly.
  const legacyBrandName = ["FN", "SN"].join("/");
  return sanitizeArticleContent(withoutImageCaptions).replaceAll(
    legacyBrandName,
    "SN",
  );
}

/**
 * @deprecated Prefer sanitizeArticleContent — kept for older imports.
 */
export function collapseLegacyArticleWhitespace(html: string) {
  return collapseEmptyAndSpacerBlocks(html);
}

/** Normalize editor HTML on paste or toolbar actions. */
export function normalizeEditorHtml(html: string) {
  if (!html.trim()) return "";
  return sanitizeArticleContent(html);
}

export function editorHtmlToPlainText(html: string) {
  return stripHtmlTags(html);
}
