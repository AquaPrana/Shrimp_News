import { launchArticles, getArticleCover, type Article } from "../src/data/articles";
import { getEnglishArticleContent } from "../src/data/article-content";
import { logDatabaseError, prisma } from "../src/lib/prisma";

const languages = ["en", "hi", "te"] as const;
type Language = (typeof languages)[number];

type ImportArticle = {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  category: string;
  language: string;
  isPublished: boolean;
};

const categoryMap: Record<string, string> = {
  India: "National",
  Global: "International",
  "Domestic Consumption": "Domestic Consumption",
  "Shrimp Farming": "Shrimp Farming",
  "Shrimp Health": "Shrimp Health",
  Technology: "Technology & Equipment",
  Research: "Research & Innovations",
  "Shrimp Prices": "Shrimp Prices",
  "Markets & Industry": "Markets & Industry",
  "Industry & Future": "Markets & Industry",
  Nutrition: "Domestic Consumption",
  Sustainability: "Research & Innovations",
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

function renderEnglishContent(article: Article) {
  const rich = getEnglishArticleContent(article.slug);
  if (!rich) return article.body.en.trim();
  return rich.blocks.map((block) => {
    if (block.type === "bullets") return block.items.map((item) => `• ${item.trim()}`).join("\n");
    return block.text.trim();
  }).filter(Boolean).join("\n\n");
}

function normalizeLanguage(value?: string) {
  return value?.trim() || "English";
}

function normalizedSlug(article: Article, language: Language) {
  const base = article.slug.trim() || slugify(article.title.en);
  return language === "en" ? base : `${base}-${language}`;
}

function normalizeArticle(article: Article, language: Language): ImportArticle {
  const title = (language === "en"
    ? getEnglishArticleContent(article.slug)?.title || article.title.en
    : article.title[language]).trim();
  const content = (language === "en" ? renderEnglishContent(article) : article.body[language]).trim();
  const excerpt = article.excerpt[language].trim() || null;
  const cover = getArticleCover(article.slug)?.trim() || null;
  const sourceCategory = article.category.en.trim();

  return {
    title,
    slug: normalizedSlug(article, language),
    content,
    excerpt,
    imageUrl: cover,
    category: categoryMap[sourceCategory] || sourceCategory,
    language: normalizeLanguage(language),
    isPublished: true,
  };
}

function unchanged(existing: ImportArticle, incoming: ImportArticle) {
  return existing.title === incoming.title
    && existing.slug === incoming.slug
    && existing.content === incoming.content
    && existing.excerpt === incoming.excerpt
    && existing.imageUrl === incoming.imageUrl
    && existing.category === incoming.category
    && existing.language === incoming.language
    && existing.isPublished === incoming.isPublished;
}

async function main() {
  const uniqueSources = [...new Map(launchArticles.map((article) => [
    article.slug.trim() || slugify(article.title.en),
    article,
  ])).values()];
  const normalized = uniqueSources.flatMap((article) => languages.map((language) => normalizeArticle(article, language)));
  const duplicateSlugs = normalized.filter((article, index) => normalized.findIndex((item) => item.slug === article.slug) !== index);
  if (duplicateSlugs.length) throw new Error(`Duplicate normalized slugs detected: ${duplicateSlugs.map((article) => article.slug).join(", ")}`);

  const existingRows = await prisma.article.findMany({
    where: { slug: { in: normalized.map((article) => article.slug) } },
  });
  const existingBySlug = new Map(existingRows.map((article) => [article.slug, article]));
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let incomplete = 0;

  for (const article of normalized) {
    if (!article.content) incomplete += 1;
    const existing = existingBySlug.get(article.slug);
    if (existing && unchanged(existing, article)) {
      skipped += 1;
      continue;
    }

    try {
      await prisma.article.upsert({
        where: { slug: article.slug },
        create: article,
        update: article,
      });
      if (existing) updated += 1;
      else imported += 1;
    } catch (error) {
      failed += 1;
      console.error(`[article-import] Failed slug: ${article.slug}`);
      logDatabaseError("article-import", error);
    }
  }

  console.log("Article import complete.");
  console.log(`Source articles: ${uniqueSources.length}`);
  console.log(`Normalized language records: ${normalized.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Incomplete content records: ${incomplete}`);

  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    logDatabaseError("article-import.fatal", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
