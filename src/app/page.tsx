import { HomePage } from "@/components/homepage/home-page";
import { FEATURED_HOMEPAGE_ARTICLE_SLUGS } from "@/lib/featured-homepage-articles";
import {
  getPublishedArticleBySlug,
  getPublishedArticles,
} from "@/lib/public-articles";
import { getPublishedEvents } from "@/lib/events";
import { baseSlug } from "@/lib/public-articles-shared";
import type { PublicArticle } from "@/lib/article-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // All language fields are returned; client selects via LanguageProvider.
  const [articles, events] = await Promise.all([
    getPublishedArticles({ limit: 100 }),
    getPublishedEvents(),
  ]);

  // Guarantee curated Featured slugs are present even if outside the latest window.
  const present = new Set(articles.map((article) => baseSlug(article.slug)));
  const missingFeatured = FEATURED_HOMEPAGE_ARTICLE_SLUGS.filter(
    (slug) => !present.has(slug),
  );
  const extras = (
    await Promise.all(
      missingFeatured.map((slug) => getPublishedArticleBySlug(slug)),
    )
  ).filter((article): article is PublicArticle => Boolean(article));

  return (
    <HomePage
      initialArticles={[...articles, ...extras]}
      initialEvents={events}
    />
  );
}
