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

test("the editor is uncontrolled, sanitizes paste, and is shared by Add and Edit", () => {
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

  assert.equal((editor.match(/onPaste=/g) || []).length, 1);
  assert.equal((editor.match(/onInput=/g) || []).length, 1);
  assert.match(editor, /pasteClipboardToArticleHtml/);
  assert.match(editor, /insertArticleHtmlAtRange/);
  assert.match(editor, /onCompositionStart/);
  assert.match(editor, /onCompositionEnd/);
  assert.match(editor, /onMouseDown=.*applyToolbarFormat/);
  assert.match(editor, /document\.execCommand\("bold"\)/);
  assert.match(editor, /document\.execCommand\("insertUnorderedList"\)/);
  assert.match(editor, /document\.execCommand\("insertOrderedList"\)/);
  assert.match(editor, /splitSelectedListLines/);
  assert.match(editor, /"formatBlock"/);
  assert.match(editor, /if \(!insertedCaret\) return;\s*event\.preventDefault\(\)/);
  assert.doesNotMatch(editor, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(editor, /onInput=\{[^}]*onContentChange/);
  assert.equal((form.match(/<ArticleContentEditor\b/g) || []).length, 1);
  assert.match(form, /contentEditorRef\.current\?\.getHtml\(\)/);
  assert.match(form, /onContentChange=\{handleEditorContentChange\}/);
  assert.doesNotMatch(form, /onChange=\{\(html\) => setField\("content"/);
  assert.doesNotMatch(form, /<Field label="Complete article content">/);
  assert.match(addPage, /<ArticleForm\s*\/>/);
  assert.match(editPage, /<ArticleForm\b/);
});

test("an explicit Paragraph toolbar choice remains a paragraph after save", () => {
  const saved = prepareArticleContentForSave(
    '<p data-article-explicit-paragraph="true">Water Quality is Important</p><p>This supporting sentence makes the article content long enough to save safely.</p>',
  );

  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.match(saved.value, /^<p>Water Quality is Important<\/p>/);
  assert.doesNotMatch(saved.value, /data-article-explicit-paragraph/);
});

test("toolbar semantic HTML survives save and public display", () => {
  const html =
    "<h2>Heading text</h2><h3>Subheading text</h3><p>Paragraph with <strong>selected bold words</strong> and enough content to validate.</p><ul><li>One</li><li>Two</li><li>Three</li></ul><ol><li>First</li><li>Second</li><li>Third</li></ol>";
  const saved = prepareArticleContentForSave(html);

  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(prepareArticleContentForDisplay(saved.value), saved.value);
  for (const tag of ["h2", "h3", "p", "strong", "ul", "ol", "li"]) {
    assert.match(saved.value, new RegExp(`<${tag}(?:>|\\s)`));
  }
});

test("browser bold markup is stored as semantic strong markup", () => {
  const saved = prepareArticleContentForSave(
    "<p>This paragraph includes <b>selected bold words</b> and enough supporting content to pass article validation.</p>",
  );

  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.match(saved.value, /<strong>selected bold words<\/strong>/);
  assert.doesNotMatch(saved.value, /<b>/);
});

test("unsafe clipboard HTML is removed without destroying useful formatting", () => {
  const pasted = pasteClipboardToArticleHtml(
    `<meta charset="utf-8"><style>.hidden{display:none}</style>
     <h2 id="docs-internal-guid">Safe heading</h2>
     <p class="MsoNormal" onclick="alert(1)">Text <strong>stays bold</strong>
       <a href="javascript:alert(1)">unsafe link</a></p>
     <script>alert(1)</script><iframe src="https://evil.example"></iframe>`,
    "Safe heading\n\nText stays bold unsafe link",
  );

  assert.match(pasted, /<h2>Safe heading<\/h2>/);
  assert.match(pasted, /<strong>stays bold<\/strong>/);
  assert.match(pasted, /unsafe link/);
  assert.doesNotMatch(pasted, /script|iframe|onclick|javascript:|docs-internal-guid|<style/i);
});

test("Unicode plain text paste preserves Telugu and Hindi", () => {
  const pasted = pasteClipboardToArticleHtml(
    "",
    "తెలుగు రొయ్యల పెంపకం సమాచారం.\n\nहिंदी झींगा पालन जानकारी।",
  );
  assert.match(pasted, /తెలుగు రొయ్యల పెంపకం సమాచారం/);
  assert.match(pasted, /हिंदी झींगा पालन जानकारी/);
});

test("editor paragraphs are never auto-promoted to headings on save or display", () => {
  const html =
    "<p>Water Quality Management Tips</p><p><strong>Important Pond Care Steps</strong></p><p>This supporting sentence makes the article content long enough to save safely.</p>";
  const saved = prepareArticleContentForSave(html);

  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.doesNotMatch(saved.value, /<h[2-4]>/);
  assert.equal(prepareArticleContentForDisplay(saved.value), saved.value);
});

test("toolbar styling survives save and display while unsafe styles are removed", () => {
  const html =
    '<h4 style="text-align: center;">Small heading</h4>' +
    '<p style="text-align: center; position: fixed;"><b style="font-size: x-large; color: rgb(185, 28, 28);">Shrimp</b> ' +
    '<i>italic</i> <u>underlined</u> <strike>old</strike> ' +
    '<span style="background-color: #fef08a; background-image: url(https://evil.example/x.png);">highlighted</span> ' +
    '<span style="color: expression(alert(1));">text</span> with enough content to validate the article body.</p>' +
    '<blockquote>Quoted text</blockquote><hr><p><a href="https://example.com" style="color: #0b4f7a;">link</a></p>';
  const saved = prepareArticleContentForSave(html);

  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.match(saved.value, /<h4 style="text-align:center">Small heading<\/h4>/);
  assert.match(saved.value, /<p style="text-align:center">/);
  assert.match(saved.value, /<strong style="font-size:x-large;color:rgb\(185, 28, 28\)">Shrimp<\/strong>/);
  assert.match(saved.value, /<em>italic<\/em>/);
  assert.match(saved.value, /<u>underlined<\/u>/);
  assert.match(saved.value, /<s>old<\/s>/);
  assert.match(saved.value, /<span style="background-color:#fef08a">highlighted<\/span>/);
  assert.match(saved.value, /<blockquote>Quoted text<\/blockquote><hr \/>/);
  assert.match(saved.value, /<a href="https:\/\/example\.com" style="color:#0b4f7a">link<\/a>/);
  assert.doesNotMatch(saved.value, /position|background-image|expression|evil\.example/);
  assert.match(saved.value, /<\/span> text with enough/);
  assert.equal(prepareArticleContentForDisplay(saved.value), saved.value);
});

test("Word paste still drops Word colours and sizes", () => {
  const pasted = pasteClipboardToArticleHtml(
    '<p class="MsoNormal" style="font-size:14pt;color:#ff0000;text-align:center">Plain Word paragraph text that is long enough.</p>',
    "",
  );
  assert.equal(pasted, "<p>Plain Word paragraph text that is long enough.</p>");
});
