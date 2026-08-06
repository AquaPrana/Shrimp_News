import assert from "node:assert/strict";
import test from "node:test";
import { normalizeArticlePagination } from "../../src/lib/article-pagination";

test("article pagination always returns valid Prisma integers", () => {
  for (const input of [
    {},
    { limit: Number.NaN, page: Number.NaN },
    { limit: Number.POSITIVE_INFINITY, page: Number.NEGATIVE_INFINITY },
    { limit: -5, page: -10 },
    { limit: 3.9, page: 2.8 },
  ]) {
    const pagination = normalizeArticlePagination(input);
    assert.equal(Number.isInteger(pagination.limit), true);
    assert.equal(Number.isInteger(pagination.page), true);
    assert.equal(Number.isInteger(pagination.skip), true);
    assert.ok(pagination.limit > 0);
    assert.ok(pagination.skip >= 0);
  }
});

test("article pagination preserves valid values and caps the public limit", () => {
  assert.deepEqual(normalizeArticlePagination({ limit: 20, page: 3 }), {
    limit: 20,
    page: 3,
    skip: 40,
  });
  assert.deepEqual(normalizeArticlePagination({ limit: 500, page: 1 }), {
    limit: 100,
    page: 1,
    skip: 0,
  });
});
