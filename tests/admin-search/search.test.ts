import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeAdminSearchQuery } from "../../src/lib/admin-search";

test("normalizes admin searches case-insensitively without changing input state", () => {
  assert.equal(normalizeAdminSearchQuery("  Water Quality  "), "water quality");
  assert.equal(normalizeAdminSearchQuery("WATER"), normalizeAdminSearchQuery("water"));
  assert.equal(normalizeAdminSearchQuery("  "), "");
});

test("search UI uses native controlled input and form submission", () => {
  const source = readFileSync("src/components/admin/admin-search.tsx", "utf8");
  assert.match(source, /<form onSubmit=\{submit\} role="search"/);
  assert.match(source, /value=\{query\}/);
  assert.match(source, /onChange=\{\(event\) => changeQuery\(event\.target\.value\)\}/);
  assert.doesNotMatch(source, /onKeyDown|onPaste|onBeforeInput|addEventListener\("keydown"/);
});

test("search requests are debounced, abortable, and use the authenticated API", () => {
  const source = readFileSync("src/components/admin/admin-search.tsx", "utf8");
  assert.match(source, /SEARCH_DEBOUNCE_MS = 300/);
  assert.match(source, /new AbortController\(\)/);
  assert.match(source, /\/api\/admin\/search\?q=/);
});

test("results use real admin destinations for every searched resource", () => {
  const route = readFileSync("src/app/api/admin/search/route.ts", "utf8");
  assert.match(route, /`\/admin\/articles\/\$\{article\.id\}\/edit`/);
  assert.match(route, /`\/admin\/events\/\$\{event\.id\}\/edit`/);
  assert.match(route, /href: "\/admin\/ticker"/);
  assert.match(route, /href: "\/admin\/subscribers"/);
});
