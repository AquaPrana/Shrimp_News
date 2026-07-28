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
  "from-budget-to-pond": "/images/articles/budget-to-pond.jpeg",
};

const FIXED_FEATURE_ARTICLES: readonly PublicArticle[] = [
  {
    id: "fixed-from-budget-to-pond",
    title:
      "From Budget to Pond — Can India Track Its 2026 Aquaculture Promises to the Farmer?",
    slug: "from-budget-to-pond",
    excerpt:
      "India’s major 2026 aquaculture commitments are tested against a five-stage public-delivery standard, from Budget announcement to measurable benefit at the pond.",
    content: "",
    featuredImageUrl: "/images/articles/budget-to-pond.jpeg",
    featuredImageAlt: "From Budget to Pond – Aquaculture Analysis",
    mainCategory: "india",
    category: "Research & Innovations",
    language: "en",
    author: getAuthorLabel("en"),
    status: "published",
    seoTitle:
      "From Budget to Pond — Can India Track Its 2026 Aquaculture Promises to the Farmer?",
    seoDescription:
      "India’s major 2026 aquaculture commitments are tested against a five-stage public-delivery standard, from Budget announcement to measurable benefit at the pond.",
    sourceUrl: "/articles/from-budget-to-pond",
    topics: ["national", "research"],
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
    publishedAt: "2026-07-23T00:00:00.000Z",
    titleEn:
      "From Budget to Pond — Can India Track Its 2026 Aquaculture Promises to the Farmer?",
    summaryEn:
      "India’s major 2026 aquaculture commitments are tested against a five-stage public-delivery standard, from Budget announcement to measurable benefit at the pond.",
    contentEn: "",
    titleTe: "",
    summaryTe: "",
    contentTe: "",
    titleHi: "",
    summaryHi: "",
    contentHi: "",
    translationAvailable: {
      en: true,
      te: false,
      hi: false,
    },
  },
];

const FIXED_FEATURE_ARTICLE_SLUGS = new Set(
  FIXED_FEATURE_ARTICLES.map((article) => baseSlug(article.slug)),
);

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
  q?: string | null;
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
 * Compact alphanumeric key for case/space/punctuation-insensitive matching.
 * "&" and "and" both become "and" before non-alphanumerics are stripped.
 */
function normalizeSearchValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/** Alias compact keys → canonical subcategory compact keys. */
const CATEGORY_ALIASES: Record<string, string> = {
  marketindustry: "marketsindustry",
  marketsandindustry: "marketsindustry",
  marketandindustry: "marketsindustry",
  technologyandequipment: "technologyequipment",
  researchandinnovation: "researchinnovations",
  researchandinnovations: "researchinnovations",
  researchinnovation: "researchinnovations",
  aquatichealth: "shrimphealth",
};

function applyCategoryAlias(normalized: string): string {
  return CATEGORY_ALIASES[normalized] || normalized;
}

function sortPublishedArticlesDesc(a: PublicArticle, b: PublicArticle) {
  const aTime = Date.parse(a.publishedAt || a.createdAt);
  const bTime = Date.parse(b.publishedAt || b.createdAt);
  return bTime - aTime;
}

function fixedArticleMatchesOptions(
  article: PublicArticle,
  options: ListOptions,
  rawQuery: string,
) {
  const topicRegion = normalizeRegion(options.topic);
  const requestedRegion = normalizeRegion(options.mainCategory);

  if (topicRegion && article.mainCategory !== topicRegion) return false;

  if (options.topic && TOPIC_CATEGORIES[options.topic]) {
    if (!TOPIC_CATEGORIES[options.topic].includes(article.category)) return false;
  } else if (requestedRegion && article.mainCategory !== requestedRegion) {
    return false;
  } else if (options.category && article.category !== options.category) {
    return false;
  }

  if (rawQuery && !articleMatchesPublicSearch(article, rawQuery)) return false;

  return true;
}

function mergeFixedFeatureArticles(
  articles: PublicArticle[],
  options: ListOptions,
  rawQuery: string,
) {
  const fixed = FIXED_FEATURE_ARTICLES.filter((article) =>
    fixedArticleMatchesOptions(article, options, rawQuery),
  );

  return [...articles.filter((article) => !FIXED_FEATURE_ARTICLE_SLUGS.has(baseSlug(article.slug))), ...fixed].sort(
    sortPublishedArticlesDesc,
  );
}

function buildBasePublishedWhere(
  options: ListOptions,
): Prisma.ArticleWhereInput {
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

  return where;
}

/**
 * Title / category / subcategory only — never content or summary.
 * Matching is done in TypeScript after a published-article fetch.
 */
function articleMatchesPublicSearch(
  article: {
    title: string;
    titleEn?: string | null;
    category: string;
    mainCategory?: string | null;
  },
  rawQuery: string,
): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  const queryWords = trimmed
    .toLowerCase()
    .replace(/&/g, "and")
    .split(/\s+/)
    .filter(Boolean);

  const normalizedQuery = applyCategoryAlias(normalizeSearchValue(trimmed));
  if (!normalizedQuery) return true;

  const titleSource = `${article.title ?? ""} ${article.titleEn ?? ""}`.trim();
  const normalizedTitle = normalizeSearchValue(titleSource);
  // Schema: `category` = topic subcategory; `mainCategory` = india | global.
  const normalizedCategory = applyCategoryAlias(
    normalizeSearchValue(article.mainCategory ?? ""),
  );
  const normalizedSubcategory = applyCategoryAlias(
    normalizeSearchValue(article.category ?? ""),
  );

  const titleWordsMatch = queryWords.every((word) =>
    normalizedTitle.includes(normalizeSearchValue(word)),
  );

  const titleCompactMatch = normalizedTitle.includes(normalizedQuery);

  const categoryMatch =
    normalizedCategory.includes(normalizedQuery) ||
    normalizedSubcategory.includes(normalizedQuery) ||
    normalizedQuery === normalizedSubcategory ||
    normalizedQuery === normalizedCategory;

  return titleWordsMatch || titleCompactMatch || categoryMatch;
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
  const skip = (page - 1) * limit;
  const where = buildBasePublishedWhere(options);
  const rawQuery = options.q?.trim() ?? "";

  // No search: fetch enough rows for the requested window, then merge one fixed entry.
  if (!rawQuery) {
    const rows = await prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: skip + limit,
    });
    return mergeFixedFeatureArticles(
      rows.map(mapPublicArticle),
      options,
      rawQuery,
    ).slice(skip, skip + limit);
  }

  // Search: fetch published candidates first, filter in TS, then paginate.
  // Avoid Prisma `contains` / collation issues and content-field matches.
  const SEARCH_FETCH_LIMIT = 500;
  const rows = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: SEARCH_FETCH_LIMIT,
  });

  const matched = rows
    .map(mapPublicArticle)
    .filter((article) =>
      articleMatchesPublicSearch(
        {
          title: article.title,
          titleEn: article.titleEn,
          category: article.category,
          mainCategory: article.mainCategory,
        },
        rawQuery,
      ),
    );

  return mergeFixedFeatureArticles(
    matched,
    options,
    rawQuery,
  ).slice(skip, skip + limit);
}

function fixedFeatureArticleBySlug(slug: string) {
  const base = baseSlug(slug);
  return (
    FIXED_FEATURE_ARTICLES.find((article) => baseSlug(article.slug) === base) ?? null
  );
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
  const fixed = fixedFeatureArticleBySlug(slug);
  if (fixed) return fixed;

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
