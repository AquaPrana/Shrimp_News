export const ARTICLE_MAIN_CATEGORIES = ["India", "Global"] as const;
export type ArticleMainCategory = (typeof ARTICLE_MAIN_CATEGORIES)[number];

/** Topic subcategories (shared base list). */
export const ARTICLE_SUBCATEGORIES = [
  "Shrimp Farming",
  "Shrimp Health",
  "Technology & Equipment",
  "Research & Innovations",
  "Shrimp Prices",
  "Domestic Consumption",
  "Markets & Industry",
] as const;

export type ArticleSubcategory = (typeof ARTICLE_SUBCATEGORIES)[number];

/** @deprecated Use ARTICLE_SUBCATEGORIES — kept as alias for existing imports. */
export const ARTICLE_CATEGORIES = ARTICLE_SUBCATEGORIES;
export type ArticleCategory = ArticleSubcategory;

export const INDIA_SUBCATEGORIES: readonly ArticleSubcategory[] = [
  "Shrimp Farming",
  "Shrimp Health",
  "Technology & Equipment",
  "Research & Innovations",
  "Shrimp Prices",
  "Domestic Consumption",
  "Markets & Industry",
];

export const GLOBAL_SUBCATEGORIES: readonly ArticleSubcategory[] = [
  "Shrimp Farming",
  "Shrimp Health",
  "Technology & Equipment",
  "Research & Innovations",
  "Shrimp Prices",
  "Markets & Industry",
];

export function subcategoriesForMain(
  main: ArticleMainCategory,
): readonly ArticleSubcategory[] {
  return main === "Global" ? GLOBAL_SUBCATEGORIES : INDIA_SUBCATEGORIES;
}

export function isValidMainCategory(
  value: string | null | undefined,
): value is ArticleMainCategory {
  return ARTICLE_MAIN_CATEGORIES.includes(value as ArticleMainCategory);
}

export function isValidSubcategory(
  value: string | null | undefined,
  main?: ArticleMainCategory,
): value is ArticleSubcategory {
  if (!ARTICLE_SUBCATEGORIES.includes(value as ArticleSubcategory)) return false;
  if (main === "Global" && value === "Domestic Consumption") return false;
  return true;
}

/**
 * Normalize legacy single-category rows (National / International)
 * into mainCategory + subcategory.
 */
export function resolveArticleTaxonomy(input: {
  mainCategory?: string | null;
  category?: string | null;
}): { mainCategory: ArticleMainCategory; category: ArticleSubcategory } {
  const rawMain = (input.mainCategory || "").trim();
  const rawCategory = (input.category || "").trim();

  if (rawCategory === "International" || rawCategory === "Global") {
    return { mainCategory: "Global", category: "Markets & Industry" };
  }
  if (rawCategory === "National" || rawCategory === "India") {
    return { mainCategory: "India", category: "Markets & Industry" };
  }

  const mainCategory: ArticleMainCategory =
    rawMain === "Global" || rawMain === "International"
      ? "Global"
      : rawMain === "India" || rawMain === "National"
        ? "India"
        : "India";

  let category: ArticleSubcategory = "Markets & Industry";
  if (isValidSubcategory(rawCategory, mainCategory)) {
    category = rawCategory;
  } else if (isValidSubcategory(rawCategory, "India")) {
    // Legacy topic stored as category; keep it and force India if Global forbids it.
    category =
      mainCategory === "Global" && rawCategory === "Domestic Consumption"
        ? "Markets & Industry"
        : (rawCategory as ArticleSubcategory);
  }

  if (mainCategory === "Global" && category === "Domestic Consumption") {
    category = "Markets & Industry";
  }

  return { mainCategory, category };
}

export const ARTICLE_LANGUAGES = ["en", "hi", "te"] as const;
export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleLanguage = (typeof ARTICLE_LANGUAGES)[number];
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type PublicArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  mainCategory: ArticleMainCategory;
  category: ArticleCategory;
  language: ArticleLanguage;
  author: string;
  status: ArticleStatus;
  seoTitle: string;
  seoDescription: string;
  sourceUrl: string | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type Subscriber = {
  id: string;
  name: string | null;
  email: string;
  language: ArticleLanguage | null;
  status: "active" | "unsubscribed";
  subscribedAt: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  mainCategory: ArticleMainCategory;
  category: ArticleCategory;
  language: ArticleLanguage;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

export const LANGUAGE_NAMES: Record<ArticleLanguage, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
};

export function readingTime(content: string) {
  const text = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}
