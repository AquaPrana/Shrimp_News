export const ARTICLE_CATEGORIES = [
  "National", "International", "Shrimp Farming", "Shrimp Health",
  "Technology & Equipment", "Research & Innovations", "Shrimp Prices",
  "Markets & Industry", "Domestic Consumption",
] as const;

export const ARTICLE_LANGUAGES = ["en", "hi", "te"] as const;
export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
export type ArticleLanguage = (typeof ARTICLE_LANGUAGES)[number];
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type PublicArticle = {
  id: string; title: string; slug: string; excerpt: string; content: string;
  featuredImageUrl: string | null; featuredImageAlt: string;
  category: ArticleCategory; language: ArticleLanguage; author: string;
  status: ArticleStatus; seoTitle: string; seoDescription: string;
  sourceUrl: string | null; topics: string[]; createdAt: string;
  updatedAt: string; publishedAt: string | null;
};

export type Subscriber = {
  id: string; name: string | null; email: string;
  language: ArticleLanguage | null; status: "active" | "unsubscribed";
  subscribedAt: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
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
  en: "English", hi: "Hindi", te: "Telugu",
};

export function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}
