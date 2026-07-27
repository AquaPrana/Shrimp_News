import "server-only";

import type { Article as PrismaArticle, Prisma } from "@prisma/client";
import type {
  ArticleCategory,
  ArticleLanguage,
  ArticleMainCategory,
  PublicArticle,
} from "@/lib/article-types";
import { resolveArticleTaxonomy } from "@/lib/article-types";
import {
  getAuthorLabel,
  hasStoredLanguageFields,
} from "@/lib/article-localization";
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
  )
    return result;
  for (const value of values) (result[value] ??= []).push(topic);
  return result;
}, {});

function resolvePublicImageUrl(slug: string, imageUrl: string | null) {
  if (imageUrl?.trim() && !imageUrl.includes("ArticleImage.jpeg")) {
    return imageUrl.trim();
  }
  return ARTICLE_IMAGE_OVERRIDES[slug] ?? imageUrl;
}

function textOrEmpty(value: string | null | undefined) {
  return value?.trim() || "";
}

/**
 * Map a canonical English article row that stores all language fields.
 * Display title/excerpt/content default to English; clients select via getLocalizedArticle.
 */
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

  const titleEn = textOrEmpty(article.titleEn) || article.title;
  const summaryEn = textOrEmpty(article.summaryEn) || article.excerpt || "";
  const contentEn = textOrEmpty(article.contentEn) || article.content;
  const titleTe = textOrEmpty(article.titleTe);
  const summaryTe = textOrEmpty(article.summaryTe);
  const contentTe = textOrEmpty(article.contentTe);
  const titleHi = textOrEmpty(article.titleHi);
  const summaryHi = textOrEmpty(article.summaryHi);
  const contentHi = textOrEmpty(article.contentHi);

  return {
    id: article.id,
    title: titleEn,
    slug: baseSlug(article.slug),
    excerpt: summaryEn,
    content: contentEn,
    featuredImageUrl,
    featuredImageAlt: titleEn,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    language: "en",
    author: getAuthorLabel("en"),
    status: "published",
    seoTitle: titleEn,
    seoDescription: summaryEn,
    sourceUrl: null,
    topics: [regionTopic, ...topicTopics],
    createdAt,
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: createdAt,
    titleEn,
    summaryEn,
    contentEn,
    titleTe,
    summaryTe,
    contentTe,
    titleHi,
    summaryHi,
    contentHi,
    translationAvailable: {
      en: hasStoredLanguageFields(
        { titleEn, contentEn, title: titleEn, content: contentEn },
        "en",
      ),
      te: Boolean(titleTe && contentTe),
      hi: Boolean(titleHi && contentHi),
    },
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

/**
 * Fetch published canonical English articles (with all language columns).
 * Language option is ignored for filtering — clients select fields locally.
 */
export async function queryPublishedArticles(
  options: ListOptions = {},
): Promise<PublicArticle[]> {
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

  const rows = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return rows.map(mapPublicArticle);
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
): Promise<PublicArticle | null> {
  try {
    const base = baseSlug(slug);
    const source = await prisma.article.findFirst({
      where: {
        isPublished: true,
        language: "en",
        slug: {
          in: [base, `${base}-te`, `${base}-hi`, slug],
        },
      },
    });
    if (!source) {
      // Legacy: article may only exist as a te/hi row — resolve English sibling.
      const any = await prisma.article.findFirst({
        where: {
          isPublished: true,
          slug: { in: [base, `${base}-te`, `${base}-hi`, slug] },
        },
      });
      if (!any) return null;
      if (any.language === "en") return mapPublicArticle(any);
      const english = any.translationGroupId
        ? await prisma.article.findFirst({
            where: {
              translationGroupId: any.translationGroupId,
              language: "en",
              isPublished: true,
            },
          })
        : await prisma.article.findFirst({
            where: { slug: base, language: "en", isPublished: true },
          });
      return english ? mapPublicArticle(english) : null;
    }
    return mapPublicArticle(source);
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
