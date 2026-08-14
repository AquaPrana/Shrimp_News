import assert from "node:assert/strict";
import test from "node:test";
import type { PublicArticle } from "../../src/lib/article-types";
import {
  selectFeaturedHomepageArticles,
  selectPopularHomepageArticles,
  selectRecentHomepageArticles,
} from "../../src/lib/featured-homepage-articles";
import { validatePrismaArticleInput } from "../../src/lib/validation";

const baseInput = {
  title: "Independent article placement controls",
  slug: "independent-article-placement-controls",
  excerpt: "Placement control test.",
  content:
    "<p>This complete article content is deliberately longer than fifty characters for validation.</p>",
  imageUrl: "",
  mainCategory: "india",
  category: "Shrimp Farming",
  isPublished: false,
};

test("Featured and Popular accept all four independent combinations", () => {
  for (const [isFeatured, isPopular] of [
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ] as const) {
    const result = validatePrismaArticleInput({
      ...baseInput,
      isFeatured,
      isPopular,
    });

    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.value.isFeatured, isFeatured);
    assert.equal(result.value.isPopular, isPopular);
  }
});

test("publishing does not automatically make an article Featured or Popular", () => {
  const result = validatePrismaArticleInput({
    ...baseInput,
    isPublished: true,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.isPublished, true);
  assert.equal(result.value.isFeatured, false);
  assert.equal(result.value.isPopular, false);
});

test("invalid non-boolean placement values are rejected", () => {
  assert.equal(
    validatePrismaArticleInput({ ...baseInput, isFeatured: "true" }).ok,
    false,
  );
  assert.equal(
    validatePrismaArticleInput({ ...baseInput, isPopular: 1 }).ok,
    false,
  );
});

test("Featured and Popular survive Save, Edit, Preview, and Publish", () => {
  const saved = validatePrismaArticleInput({
    ...baseInput,
    isFeatured: true,
    isPopular: true,
  });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;

  const edited = { ...saved.value, title: "Edited placement controls" };
  const previewed = { ...edited };
  const published = validatePrismaArticleInput({
    ...previewed,
    isPublished: true,
  });

  assert.equal(published.ok, true);
  if (!published.ok) return;
  assert.equal(published.value.isFeatured, true);
  assert.equal(published.value.isPopular, true);
  assert.equal(published.value.isPublished, true);
});

function article(
  id: string,
  isFeatured: boolean,
  isPopular: boolean,
  status: PublicArticle["status"] = "published",
): PublicArticle {
  return {
    id,
    title: `Article ${id}`,
    slug: `article-${id}`,
    excerpt: "",
    content: "<p>Article body.</p>",
    featuredImageUrl: null,
    featuredImageAlt: "",
    mainCategory: "india",
    category: "Shrimp Farming",
    author: "Shrimp News Editorial",
    status,
    isFeatured,
    isPopular,
    seoTitle: `Article ${id}`,
    seoDescription: "",
    sourceUrl: null,
    topics: [],
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
    publishedAt: "2026-08-05T00:00:00.000Z",
  };
}

test("public Featured and Popular selectors use only their respective flags", () => {
  const articles = [
    article("featured", true, false),
    article("popular", false, true),
    article("both", true, true),
    article("neither", false, false),
    article("draft-both", true, true, "draft"),
  ];

  assert.deepEqual(
    selectFeaturedHomepageArticles(articles).map(({ id }) => id),
    ["featured", "both"],
  );
  assert.deepEqual(
    selectPopularHomepageArticles(articles).map(({ id }) => id),
    ["popular", "both"],
  );
});

test("Featured falls back to latest published articles when no flags are set", () => {
  const older = article("older", false, false);
  older.publishedAt = "2026-01-01T00:00:00.000Z";
  older.createdAt = "2026-01-01T00:00:00.000Z";
  const newer = article("newer", false, false);
  newer.publishedAt = "2026-08-01T00:00:00.000Z";
  newer.createdAt = "2026-08-01T00:00:00.000Z";
  const draft = article("draft", false, false, "draft");
  draft.publishedAt = "2026-09-01T00:00:00.000Z";

  const articles = [older, newer, draft];
  assert.deepEqual(
    selectFeaturedHomepageArticles(articles).map(({ id }) => id),
    ["newer", "older"],
  );
  assert.deepEqual(
    selectPopularHomepageArticles(articles).map(({ id }) => id),
    [],
  );
});

test("Popular does not reuse the Recent list when no articles are marked popular", () => {
  const recent = selectRecentHomepageArticles([
    article("a", false, false),
    article("b", false, false),
  ]);
  const popular = selectPopularHomepageArticles([
    article("a", false, false),
    article("b", false, false),
  ]);

  assert.equal(recent.length > 0, true);
  assert.deepEqual(
    popular.map(({ id }) => id),
    [],
  );
});

test("Recent uses latest published articles without a recent flag", () => {
  const older = article("older", false, false);
  older.publishedAt = "2026-01-01T00:00:00.000Z";
  const newer = article("newer", false, false);
  newer.publishedAt = "2026-08-01T00:00:00.000Z";
  const newest = article("newest", true, true);
  newest.publishedAt = "2026-08-10T00:00:00.000Z";
  const draft = article("draft", false, false, "draft");
  draft.publishedAt = "2026-09-01T00:00:00.000Z";

  assert.deepEqual(
    selectRecentHomepageArticles([older, draft, newest, newer], 2).map(
      ({ id }) => id,
    ),
    ["newest", "newer"],
  );
});

test("boolean-like Featured and Popular values are treated as true", () => {
  const featured = article("featured-one", false, false);
  const popular = article("popular-one", false, false);
  (featured as { isFeatured: unknown }).isFeatured = 1;
  (popular as { isPopular: unknown }).isPopular = "true";

  assert.deepEqual(
    selectFeaturedHomepageArticles([featured, popular]).map(({ id }) => id),
    ["featured-one"],
  );
  assert.deepEqual(
    selectPopularHomepageArticles([featured, popular]).map(({ id }) => id),
    ["popular-one"],
  );
});
