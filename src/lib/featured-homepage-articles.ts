import type { PublicArticle } from "@/lib/article-types";
import { baseSlug } from "@/lib/public-articles-shared";

/**
 * Fixed homepage Featured carousel order.
 * Resolve real published article records by slug — do not invent card fields.
 */
export const FEATURED_HOMEPAGE_ARTICLE_SLUGS = [
  "from-budget-to-pond",
  "five-years-of-indias-shrimp-industry-production-trends-state-wise-performance-and-industry-insights-202122-to-202526",
  "why-water-testing-is-the-most-important-daily-job-on-every-shrimp-farm",
  "business-of-shrimp-farming-is-shrimp-farming-profitable-in-india",
  "how-shrimp-travels-from-farm-to-your-plate",
  "understanding-shrimp-diseases-prevention-is-always-better-than-treatment",
  "shrimp-is-one-of-the-healthiest-proteins-you-can-eat",
] as const;

export function selectFeaturedHomepageArticles(
  articles: PublicArticle[],
): PublicArticle[] {
  const bySlug = new Map(
    articles.map((article) => [baseSlug(article.slug), article]),
  );

  return FEATURED_HOMEPAGE_ARTICLE_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (article): article is PublicArticle => Boolean(article),
  );
}
