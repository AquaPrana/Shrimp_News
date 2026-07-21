import "server-only";

import type { Article as PrismaArticle, Prisma } from "@prisma/client";
import type { ArticleCategory, ArticleLanguage, PublicArticle } from "@/lib/article-types";
import { logDatabaseError, prisma } from "@/lib/prisma";
import {
  TOPIC_CATEGORIES as SHARED_TOPIC_CATEGORIES,
  TOPIC_LABELS,
  isArticleTopic,
} from "@/lib/public-articles-shared";

export const TOPIC_CATEGORIES = SHARED_TOPIC_CATEGORIES as Record<string, ArticleCategory[]>;
export { TOPIC_LABELS, isArticleTopic };

/** Prefer real aquaculture covers over the shared placeholder. */
const ARTICLE_IMAGE_OVERRIDES: Record<string, string> = {
  "andhra-pradesh-seeks-centres-support-to-protect-aquaculture-sector-amid-rising-shrimp-feed-costs":
    "/images/articles/andrapradesh-aqua-culture.jpeg",
};

const CATEGORY_TOPICS = Object.entries(TOPIC_CATEGORIES).reduce<Record<string, string[]>>(
  (result, [topic, categories]) => {
    for (const category of categories) (result[category] ??= []).push(topic);
    return result;
  },
  {},
);

function resolvePublicImageUrl(slug: string, imageUrl: string | null) {
  // Prefer the value saved in the database for daily publishing.
  if (imageUrl?.trim() && !imageUrl.includes("ArticleImage.jpeg")) {
    return imageUrl.trim();
  }
  return ARTICLE_IMAGE_OVERRIDES[slug] ?? imageUrl;
}

export function mapPublicArticle(article: PrismaArticle): PublicArticle {
  const createdAt = article.createdAt.toISOString();
  const featuredImageUrl = resolvePublicImageUrl(article.slug, article.imageUrl);
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content,
    featuredImageUrl,
    featuredImageAlt: article.title,
    category: article.category as ArticleCategory,
    language: article.language as ArticleLanguage,
    author: "Shrimp.News Editorial",
    status: "published",
    seoTitle: article.title,
    seoDescription: article.excerpt || "",
    sourceUrl: null,
    topics: CATEGORY_TOPICS[article.category] || [],
    createdAt,
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: createdAt,
  };
}

export function localizedSlug(slug: string, language: ArticleLanguage) {
  const base = slug.replace(/-(hi|te)$/, "");
  return language === "en" ? base : `${base}-${language}`;
}

type ListOptions = {
  language?: ArticleLanguage;
  topic?: string | null;
  category?: string | null;
  limit?: number;
};

export async function getPublishedArticles(options: ListOptions = {}): Promise<PublicArticle[]> {
  const language = options.language || "en";
  const limit = Math.min(Math.max(options.limit || 60, 1), 100);
  const where: Prisma.ArticleWhereInput = {
    isPublished: true,
    language,
  };

  if (options.topic && TOPIC_CATEGORIES[options.topic]) {
    where.category = { in: TOPIC_CATEGORIES[options.topic] };
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
    const requestedSlug = language ? localizedSlug(slug, language) : slug;
    const article = await prisma.article.findFirst({
      where: { slug: requestedSlug, isPublished: true },
    });
    if (article) return mapPublicArticle(article);

    // Fallback: try the raw slug if a language-specific slug was not found.
    if (language && requestedSlug !== slug) {
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
        category: article.category,
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
