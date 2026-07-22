import "server-only";

import type { Article as PrismaArticle, Prisma } from "@prisma/client";
import type {
  ArticleCategory,
  ArticleLanguage,
  ArticleMainCategory,
  PublicArticle,
} from "@/lib/article-types";
import { resolveArticleTaxonomy } from "@/lib/article-types";
import { logDatabaseError, prisma } from "@/lib/prisma";
import {
  TOPIC_CATEGORIES as SHARED_TOPIC_CATEGORIES,
  TOPIC_LABELS,
  baseSlug,
  isArticleTopic,
  languageFromSlug,
} from "@/lib/public-articles-shared";

export const TOPIC_CATEGORIES = SHARED_TOPIC_CATEGORIES;
export { TOPIC_LABELS, isArticleTopic, baseSlug, languageFromSlug };

/** Prefer real aquaculture covers over the shared placeholder. */
const ARTICLE_IMAGE_OVERRIDES: Record<string, string> = {
  "andhra-pradesh-seeks-centres-support-to-protect-aquaculture-sector-amid-rising-shrimp-feed-costs":
    "/images/articles/andrapradesh-aqua-culture.jpeg",
};

const SUBCATEGORY_TOPICS = Object.entries(TOPIC_CATEGORIES).reduce<
  Record<string, string[]>
>((result, [topic, values]) => {
  if (topic === "national" || topic === "international") return result;
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
    taxonomy.mainCategory === "Global" ? "international" : "national";
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
};

export async function getPublishedArticles(
  options: ListOptions = {},
): Promise<PublicArticle[]> {
  const language = options.language || "en";
  const limit = Math.min(Math.max(options.limit || 60, 1), 100);
  const where: Prisma.ArticleWhereInput = {
    isPublished: true,
    language,
  };

  if (options.topic === "national") {
    where.mainCategory = "India";
  } else if (options.topic === "international") {
    where.mainCategory = "Global";
  } else if (options.topic && TOPIC_CATEGORIES[options.topic]) {
    where.category = { in: TOPIC_CATEGORIES[options.topic] };
  } else if (options.mainCategory === "India" || options.mainCategory === "Global") {
    where.mainCategory = options.mainCategory;
  } else if (options.category) {
    where.category = options.category;
  }

  try {
    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return articles.map(mapPublicArticle);
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
    const requestedSlug = localizedSlug(base, requestedLanguage);

    const article = await prisma.article.findFirst({
      where: { slug: requestedSlug, isPublished: true },
    });
    if (article) return mapPublicArticle(article);

    if (requestedLanguage !== "en") {
      const english = await prisma.article.findFirst({
        where: { slug: base, isPublished: true, language: "en" },
      });
      if (english?.translationGroupId) {
        const sibling = await prisma.article.findFirst({
          where: {
            translationGroupId: english.translationGroupId,
            language: requestedLanguage,
            isPublished: true,
          },
        });
        if (sibling) return mapPublicArticle(sibling);
      }
    }

    if (requestedSlug !== slug) {
      const fallback = await prisma.article.findFirst({
        where: { slug, isPublished: true },
      });
      return fallback ? mapPublicArticle(fallback) : null;
    }

    return null;
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
    const related = await prisma.article.findMany({
      where: {
        id: { not: article.id },
        isPublished: true,
        language: article.language,
        OR: [
          { category: article.category },
          { mainCategory: article.mainCategory },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return related.map(mapPublicArticle);
  } catch (error) {
    logDatabaseError("public-articles.related", error);
    return [];
  }
}

export type { ArticleMainCategory, ArticleCategory };
