import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  pasteClipboardToArticleHtml,
  prepareArticleContentForDisplay,
  prepareArticleContentForSave,
  preserveExistingArticleContent,
  stripHtmlTags,
} from "../../src/lib/article-content";

const WORD_HTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office">
<head><meta charset="utf-8"><style>.MsoNormal { margin: 0; }</style></head>
<body><!--StartFragment-->
<p class="MsoTitle">A Complete Word Article Heading</p>
<p class="MsoNormal">First paragraph with <b>bold text</b>, a<br>line break, and <a href="https://example.com/source">a source link</a>.</p>
<p class="MsoHeading2">Important Farming Practices</p>
<p class="MsoListParagraph">• Keep water quality stable</p>
<p class="MsoListParagraph">• Monitor feed every day</p>
<p class="MsoNormal">Final paragraph remains present after publishing.</p>
<!--EndFragment--></body></html>`;

test("Word paste preserves content and semantic formatting", () => {
  const pasted = pasteClipboardToArticleHtml(WORD_HTML, [
    "A Complete Word Article Heading", "", "First paragraph with bold text, a",
    "line break, and a source link.", "", "Important Farming Practices", "",
    "• Keep water quality stable", "• Monitor feed every day", "",
    "Final paragraph remains present after publishing.",
  ].join("\r\n"));

  assert.match(pasted, /<h2>A Complete Word Article Heading<\/h2>/);
  assert.match(pasted, /<(?:strong|b)>bold text<\/(?:strong|b)>/);
  assert.match(pasted, /<a href="https:\/\/example\.com\/source">a source link<\/a>/);
  assert.match(pasted, /<h3>Important Farming Practices<\/h3>/);
  assert.match(pasted, /<ul><li>Keep water quality stable<\/li><li>Monitor feed every day<\/li><\/ul>/);
  assert.match(pasted, /Final paragraph remains present after publishing/);
  assert.doesNotMatch(pasted, /<html|<head|<style|StartFragment|MsoNormal/i);
});

test("plain text pastes on the first conversion with paragraphs and line breaks", () => {
  const pasted = pasteClipboardToArticleHtml(
    "",
    "First paragraph line one.\r\nLine two.\r\n\r\nSecond paragraph remains complete.",
  );

  assert.match(pasted, /<p>First paragraph line one\.<br\s*\/?\s*>Line two\.<\/p>/);
  assert.match(pasted, /<p>Second paragraph remains complete\.<\/p>/);
});

test("Save, edit, preview, and publish keep the same complete HTML", () => {
  const pasted = pasteClipboardToArticleHtml(WORD_HTML, "");
  const saved = prepareArticleContentForSave(pasted);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;

  const edited = prepareArticleContentForDisplay(saved.value);
  const previewed = prepareArticleContentForDisplay(edited);
  const published = prepareArticleContentForSave(previewed);

  assert.equal(published.ok, true);
  if (!published.ok) return;
  assert.equal(published.value, saved.value);
  assert.equal(stripHtmlTags(published.value), stripHtmlTags(pasted));
});

test("empty editor payload cannot overwrite existing content", () => {
  const existing = "<p>This complete existing article body must remain stored.</p>";
  assert.equal(preserveExistingArticleContent("", existing), existing);
  assert.equal(preserveExistingArticleContent("   ", existing), existing);
  assert.equal(preserveExistingArticleContent(undefined, existing), existing);
});

test("long Word articles paste and save without truncation", () => {
  const paragraphs = Array.from(
    { length: 12_000 },
    (_, index) => `<p>Paragraph ${index + 1}: shrimp farming observations and complete production notes.</p>`,
  ).join("");
  const pasted = pasteClipboardToArticleHtml(
    `<html><head><style>.MsoNormal{margin:0}</style></head><body><!--StartFragment-->${paragraphs}<!--EndFragment--></body></html>`,
    "",
  );
  const saved = prepareArticleContentForSave(pasted);

  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal((saved.value.match(/<p>/g) || []).length, 12_000);
  assert.match(saved.value, /Paragraph 12000:/);
});

test("the editor leaves paste native and is shared by Add and Edit", () => {
  const editor = readFileSync(
    "src/components/admin/article-content-editor.tsx",
    "utf8",
  );
  const form = readFileSync("src/components/admin/article-form.tsx", "utf8");
  const addPage = readFileSync(
    "src/app/admin/(dashboard)/articles/new/page.tsx",
    "utf8",
  );
  const editPage = readFileSync(
    "src/app/admin/(dashboard)/articles/[id]/edit/page.tsx",
    "utf8",
  );

  assert.equal((editor.match(/onPaste=/g) || []).length, 0);
  assert.equal((editor.match(/onInput=/g) || []).length, 1);
  assert.doesNotMatch(
    editor,
    /onBeforeInput=|onKeyDown=|preventDefault\(\)[\s\S]*paste|requestAnimationFrame|setTimeout|pasteClipboardToArticleHtml/,
  );
  assert.equal((form.match(/<ArticleContentEditor\b/g) || []).length, 1);
  assert.match(addPage, /<ArticleForm\s*\/>/);
  assert.match(editPage, /<ArticleForm\b/);
});
