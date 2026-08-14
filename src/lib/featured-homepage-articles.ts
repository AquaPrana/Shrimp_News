import type { PublicArticle } from "@/lib/article-types";

function isTrueFlag(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function isPubliclyListedArticle(article: PublicArticle) {
  // Public list queries already return published rows. Keep drafts out if status is set.
  return article.status !== "draft";
}

function articleTimestamp(article: PublicArticle) {
  const raw = article.publishedAt || article.createdAt;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : 0;
}

function sortByNewest(articles: PublicArticle[]) {
  return [...articles].sort((a, b) => articleTimestamp(b) - articleTimestamp(a));
}

export function selectRecentHomepageArticles(
  articles: PublicArticle[],
  limit = 5,
) {
  return sortByNewest(articles.filter(isPubliclyListedArticle)).slice(0, limit);
}

export function selectFeaturedHomepageArticles(
  articles: PublicArticle[],
): PublicArticle[] {
  const published = sortByNewest(articles.filter(isPubliclyListedArticle));
  const featured = published.filter((article) => isTrueFlag(article.isFeatured));
  return featured.length > 0 ? featured : published.slice(0, 9);
}

export function selectPopularHomepageArticles(
  articles: PublicArticle[],
  limit = 5,
): PublicArticle[] {
  return sortByNewest(
    articles.filter(
      (article) =>
        isPubliclyListedArticle(article) && isTrueFlag(article.isPopular),
    ),
  ).slice(0, limit);
}
