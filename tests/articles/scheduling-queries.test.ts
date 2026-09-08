import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import type { Article } from "@prisma/client";

// Execute the real server query module against an isolated in-memory Prisma adapter.
// The server-only marker is supplied here; no production database is contacted.
const localRequire = createRequire(import.meta.url);
function loadServerModule(path: string, replacements: Record<string, unknown>, env: Record<string, string> = {}) {
  const filename = resolve(path);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, console, Date, Set, process: { env },
    require: (name: string) => name in replacements ? replacements[name] : localRequire(name.startsWith("@/") ? resolve("src", name.slice(2)) : name),
  }, { filename });
  return module.exports;
}

type Where = Record<string, unknown>;
function matches(row: Article, where: Where = {}): boolean {
  return Object.entries(where).every(([key, filter]) => {
    if (key === "AND") return (filter as Where[]).every((item) => matches(row, item));
    if (key === "OR") return (filter as Where[]).some((item) => matches(row, item));
    const value = row[key as keyof Article];
    if (filter && typeof filter === "object") return Object.entries(filter).every(([op, expected]) => {
      if (op === "in") return (expected as unknown[]).includes(value);
      if (op === "not") return value !== expected;
      if (op === "lte") return value !== null && Number(value) <= Number(expected);
      throw new Error(`Unhandled filter ${op}`);
    });
    return value === filter;
  });
}

function fixture() {
  const now = Date.now();
  function row(id: string, publication: Partial<Article>): Article {
    return { id, slug: id, title: `Shrimp ${id}`, content: "Complete content", excerpt: "Summary", imageUrl: null,
      mainCategory: "india", category: "Shrimp Farming", isFeatured: true, isPopular: true,
      createdAt: new Date(now - 100000), updatedAt: new Date(now - 100000),
      isPublished: false, publishedAt: null, scheduledAt: null, ...publication };
  }
  const rows = [row("draft", {}), row("future", { scheduledAt: new Date(now + 86400000) }),
    row("future-flagged", { scheduledAt: new Date(now + 86400000), isPublished: true }),
    row("due", { scheduledAt: new Date(now - 1000) }),
    row("published", { isPublished: true, publishedAt: new Date(now - 50000) })];
  const prisma = { article: {
    findMany: async ({ where, orderBy, take }: { where?: Where; orderBy?: Record<string, string> | Record<string, string>[]; take?: number }) => {
      const result = rows.filter((row) => matches(row, where));
      if (orderBy) result.sort((a, b) => {
        for (const order of Array.isArray(orderBy) ? orderBy : [orderBy]) {
          const key = Object.keys(order)[0] as keyof Article;
          const difference = Number(b[key]) - Number(a[key]);
          if (difference) return difference;
        }
        return 0;
      });
      return take === undefined ? result : result.slice(0, take);
    },
    findFirst: async ({ where }: { where: Where }) => rows.find((row) => matches(row, where)) ?? null,
    findUnique: async ({ where }: { where: Where }) => rows.find((row) => matches(row, where)) ?? null,
  } };
  const api = loadServerModule("src/lib/public-articles.ts", { "server-only": {}, "@/lib/prisma": { prisma, logDatabaseError: (_: unknown, error: unknown) => { throw error; } } }) as typeof import("../../src/lib/public-articles");
  return { rows, row, api };
}

test("real public lists exclude future schedules across home, placements, topics and search", async () => {
  const { api } = fixture();
  for (const options of [{}, { isFeatured: true }, { isPopular: true }, { category: "Shrimp Farming" }, { mainCategory: "india" }, { topic: "shrimp-farming" }, { q: "Shrimp" }]) {
    const articles = await api.queryPublishedArticles(options);
    const ids = articles.map((article) => article.id);
    assert.ok(ids.includes("due"));
    assert.ok(ids.includes("published"));
    for (const hidden of ["draft", "future", "future-flagged"]) assert.ok(!ids.includes(hidden));
    assert.ok(ids.indexOf("due") < ids.indexOf("published"));
  }
  const first = await api.queryPublishedArticles({ limit: 1 });
  const second = await api.queryPublishedArticles({ limit: 1, page: 2 });
  assert.equal(first[0].id, "due");
  assert.equal(second[0].id, "published");
});

test("direct article access and related articles use the same guard without cron promotion", async () => {
  const { api, rows } = fixture();
  for (const slug of ["draft", "future", "future-flagged"]) assert.equal(await api.getPublishedArticleBySlug(slug), null);
  const due = await api.getPublishedArticleBySlug("due");
  assert.ok(due);
  assert.equal(due.publishedAt, rows.find((row) => row.id === "due")?.scheduledAt?.toISOString());
  assert.equal(rows.find((row) => row.id === "due")?.isPublished, false);
  const related = await api.getRelatedPublishedArticles(due);
  assert.deepEqual(Array.from(related, (article) => article.id), ["published"]);
});

test("built-in feature cannot bypass a stored draft or future schedule", async () => {
  const { api, rows, row } = fixture();
  rows.push(row("from-budget-to-pond", { scheduledAt: new Date(Date.now() + 86400000) }));
  assert.equal(await api.getPublishedArticleBySlug("from-budget-to-pond"), null);
  assert.ok(!(await api.queryPublishedArticles()).some((article) => article.slug === "from-budget-to-pond"));
});

test("cron route fails closed and calls the publisher only with a valid secret", async () => {
  let calls = 0;
  const dependencies = {
    "next/server": { NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init) } },
    "@/lib/publish-scheduled-articles": { publishScheduledArticles: async () => { calls++; return 2; } },
    "@/lib/prisma": { logDatabaseError: () => {} },
  };
  const path = "src/app/api/cron/publish-articles/route.ts";
  const missing = loadServerModule(path, dependencies) as typeof import("../../src/app/api/cron/publish-articles/route");
  assert.equal((await missing.GET(new Request("https://example.test"))).status, 503);
  const configured = loadServerModule(path, dependencies, { CRON_SECRET: "test-secret" }) as typeof missing;
  assert.equal((await configured.GET(new Request("https://example.test"))).status, 401);
  assert.equal((await configured.GET(new Request("https://example.test", { headers: { Authorization: "Bearer incorrect" } }))).status, 401);
  assert.equal(calls, 0);
  const result = await configured.GET(new Request("https://example.test", { headers: { Authorization: "Bearer test-secret" } }));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { success: true, published: 2 });
  assert.equal(calls, 1);
});
