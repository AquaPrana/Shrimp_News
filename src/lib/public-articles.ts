import "server-only";

import type { Article as PrismaArticle, Prisma } from "@prisma/client";
import type {
  ArticleCategory,
  ArticleLanguage,
  ArticleMainCategory,
  PublicArticle,
} from "@/lib/article-types";
import { resolveArticleTaxonomy } from "@/lib/article-types";
import { selectArticleByLanguage } from "@/lib/article-localization";
import { logDatabaseError, prisma } from "@/lib/prisma";
import {
  TOPIC_CATEGORIES as SHARED_TOPIC_CATEGORIES,
  TOPIC_LABELS,
  baseSlug,
  isArticleTopic,
  languageFromSlug,
  normalizeArticleTopic,
} from "@/lib/public-articles-shared";

export const TOPIC_CATEGORIES = SHARED_TOPIC_CATEGORIES;
export {
  TOPIC_LABELS,
  isArticleTopic,
  baseSlug,
  languageFromSlug,
  normalizeArticleTopic,
};

/** Prefer real aquaculture covers over the shared placeholder. */
const ARTICLE_IMAGE_OVERRIDES: Record<string, string> = {
  "andhra-pradesh-seeks-centres-support-to-protect-aquaculture-sector-amid-rising-shrimp-feed-costs":
    "/images/articles/andrapradesh-aqua-culture.jpeg",
};

const SUBCATEGORY_TOPICS = Object.entries(TOPIC_CATEGORIES).reduce<
  Record<string, string[]>
>((result, [topic, values]) => {
  if (
    topic === "india" ||
    topic === "global" ||
    topic === "national" ||
    topic === "international"
  ) return result;
  for (const value of values) (result[value] ??= []).push(topic);
  return result;
}, {});

function resolvePublicImageUrl(slug: string, imageUrl: string | null) {
  if (imageUrl?.trim() && !imageUrl.includes("ArticleImage.jpeg")) {
    return imageUrl.trim();
  }
  return ARTICLE_IMAGE_OVERRIDES[slug] ?? imageUrl;
}

export function mapPublicArticle(article: PrismaArticle): PublicArticle {
  const createdAt = article.createdAt.toISOString();
  const featuredImageUrl = resolvePublicImageUrl(article.slug, article.imageUrl);
  const taxonomy = resolveArticleTaxonomy({
    mainCategory: article.mainCategory,
    category: article.category,
  });
  const regionTopic =
    taxonomy.mainCategory === "global" ? "international" : "national";
  const topicTopics = SUBCATEGORY_TOPICS[taxonomy.category] || [];

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content,
    featuredImageUrl,
    featuredImageAlt: article.title,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    language: article.language as ArticleLanguage,
    author: "Shrimp.News Editorial",
    status: "published",
    seoTitle: article.title,
    seoDescription: article.excerpt || "",
    sourceUrl: null,
    topics: [regionTopic, ...topicTopics],
    createdAt,
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: createdAt,
  };
}

export function localizedSlug(slug: string, language: ArticleLanguage) {
  const base = baseSlug(slug);
  return language === "en" ? base : `${base}-${language}`;
}

type ListOptions = {
  language?: ArticleLanguage;
  topic?: string | null;
  category?: string | null;
  mainCategory?: string | null;
  limit?: number;
  page?: number;
};

function normalizeRegion(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "national" || normalized === "india") return "india";
  if (normalized === "international" || normalized === "global") return "global";
  return null;
}

function regionFilter(region: "india" | "global"): Prisma.StringFilter {
  return region === "india"
    ? { in: ["India", "india", "National", "national"] }
    : { in: ["Global", "global", "International", "international"] };
}

function translationGroupKey(article: PrismaArticle) {
  return article.translationGroupId
    ? `group:${article.translationGroupId}`
    : `slug:${baseSlug(article.slug)}`;
}

/**
 * Query matching published article groups independently of display language,
 * then choose the requested translation with English/original fallbacks.
 */
export async function queryPublishedArticles(
  options: ListOptions = {},
): Promise<PublicArticle[]> {
  const language = options.language || "en";
  const limit = Math.min(Math.max(options.limit || 60, 1), 100);
  const page = Math.max(options.page || 1, 1);
  const topicRegion = normalizeRegion(options.topic);
  const requestedRegion = normalizeRegion(options.mainCategory);
  const where: Prisma.ArticleWhereInput = {
    isPublished: true,
    language: "en",
  };

  if (topicRegion) {
    where.mainCategory = regionFilter(topicRegion);
  } else if (options.topic && TOPIC_CATEGORIES[options.topic]) {
    where.category = { in: TOPIC_CATEGORIES[options.topic] };
  } else if (requestedRegion) {
    where.mainCategory = regionFilter(requestedRegion);
  } else if (options.category) {
    where.category = options.category;
  }

  const canonicalRows = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  const pageRows = canonicalRows.slice(
    (page - 1) * limit,
    page * limit,
  );
  if (pageRows.length === 0) return [];

  const groupIds = pageRows
    .map((article) => article.translationGroupId)
    .filter((value): value is string => Boolean(value));
  const localizedSlugs = pageRows.flatMap((article) => [
    `${baseSlug(article.slug)}-te`,
    `${baseSlug(article.slug)}-hi`,
  ]);
  const translations = await prisma.article.findMany({
    where: {
      isPublished: true,
      OR: [
        ...(groupIds.length > 0
          ? [{ translationGroupId: { in: groupIds } }]
          : []),
        { slug: { in: localizedSlugs } },
      ],
    },
  });
  const groups = new Map<string, PrismaArticle[]>();
  const canonicalKeyBySlug = new Map(
    pageRows.map((article) => [
      baseSlug(article.slug),
      translationGroupKey(article),
    ]),
  );
  for (const article of [...pageRows, ...translations]) {
    const key =
      canonicalKeyBySlug.get(baseSlug(article.slug)) ||
      translationGroupKey(article);
    const group = groups.get(key);
    if (group) group.push(article);
    else groups.set(key, [article]);
  }

  return [...groups.values()]
    .map((group) => selectArticleByLanguage(group, language))
    .filter((article): article is PrismaArticle => Boolean(article))
    .map(mapPublicArticle);
}

export async function getPublishedArticles(
  options: ListOptions = {},
): Promise<PublicArticle[]> {
  try {
    return await queryPublishedArticles(options);
  } catch (error) {
    logDatabaseError("public-articles.list", error);
    return [];
  }
}

export async function getPublishedArticleBySlug(
  slug: string,
  language?: ArticleLanguage | null,
): Promise<PublicArticle | null> {
  try {
    const base = baseSlug(slug);
    const requestedLanguage = language || "en";
    const source = await prisma.article.findFirst({
      where: {
        isPublished: true,
        slug: {
          in: [base, `${base}-te`, `${base}-hi`, slug],
        },
      },
    });
    if (!source) return null;
    const versions = await prisma.article.findMany({
      where: source.translationGroupId
        ? {
            translationGroupId: source.translationGroupId,
            isPublished: true,
          }
        : {
            slug: { in: [base, `${base}-te`, `${base}-hi`] },
            isPublished: true,
          },
    });
    const selected = selectArticleByLanguage(versions, requestedLanguage);
    return selected ? mapPublicArticle(selected) : null;
  } catch (error) {
    logDatabaseError("public-articles.get", error);
    return null;
  }
}

export async function getRelatedPublishedArticles(
  article: PublicArticle,
  limit = 3,
): Promise<PublicArticle[]> {
  try {
    const related = await queryPublishedArticles({
      language: article.language,
      category: article.category,
      limit: limit + 1,
    });
    return related
      .filter((candidate) => baseSlug(candidate.slug) !== baseSlug(article.slug))
      .slice(0, limit);
  } catch (error) {
    logDatabaseError("public-articles.related", error);
    return [];
  }
}

export type { ArticleMainCategory, ArticleCategory };
