import type { PublicArticle } from "@/lib/article-types";
export function selectFeaturedHomepageArticles(
  articles: PublicArticle[],
): PublicArticle[] {
  return articles.filter(
    (article) => article.status === "published" && article.isFeatured,
  );
}

export function selectPopularHomepageArticles(
  articles: PublicArticle[],
): PublicArticle[] {
  return articles.filter(
    (article) => article.status === "published" && article.isPopular,
  );
}
