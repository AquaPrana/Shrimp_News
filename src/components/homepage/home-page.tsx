"use client";

import { EditorialHero } from "@/components/homepage/editorial-hero";
import { EventsGrid } from "@/components/homepage/events-grid";
import { FeaturedArticlesCarousel } from "@/components/homepage/featured-articles-carousel";
import { LatestArticlesGrid } from "@/components/homepage/latest-articles-grid";
import { MarketTicker } from "@/components/homepage/market-ticker";
import { NewsSidebar } from "@/components/homepage/news-sidebar";
import { NewsletterSection } from "@/components/homepage/newsletter-section";
import { ShrimpFarmingGrid } from "@/components/homepage/shrimp-farming-grid";
import { useLanguage } from "@/context/language-context";
import { useArticles } from "@/hooks/use-articles";
import { useLocalizedArticles } from "@/hooks/use-localized-articles";
import type { PublicArticle } from "@/lib/article-types";
import type { PublicEvent } from "@/lib/event-types";
import { selectHomepageEvents } from "@/lib/events-selection";
import { selectFeaturedHomepageArticles } from "@/lib/featured-homepage-articles";

export function HomePage({
  initialArticles = [],
  initialEvents = [],
}: {
  initialArticles?: PublicArticle[];
  initialEvents?: PublicEvent[];
}) {
  const budgetToPondSlug = "from-budget-to-pond";
  const { t } = useLanguage();
  const { articles: fetchedArticles, loading, error } = useArticles(
    { limit: 60 },
    initialArticles,
  );
  const articles = useLocalizedArticles(fetchedArticles);
  const heroArticles = articles.slice(0, 4);
  const featuredSlugSet = new Set(heroArticles.map((article) => article.slug));
  const featuredArticle = articles[0];
  const featuredCarouselArticles = selectFeaturedHomepageArticles(articles);

  const budgetToPondArticle = articles.find(
    (article) => article.slug === budgetToPondSlug,
  );
  const nonHeroArticles = articles.filter(
    (article) =>
      article.status === "published" && !featuredSlugSet.has(article.slug),
  );
  const homeArticleCandidates = budgetToPondArticle
    ? [
        budgetToPondArticle,
        ...nonHeroArticles.filter(
          (article) => article.slug !== budgetToPondSlug,
        ),
      ]
    : nonHeroArticles;
  const homeArticles = homeArticleCandidates.slice(0, 12);
  const homepageEvents = selectHomepageEvents(initialEvents);

  if (!featuredArticle) {
    return (
      <div className="min-h-full bg-white">
        <MarketTicker />
        <EditorialHero articles={articles} />
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div
            role="status"
            className="mx-auto max-w-[1340px] rounded-[24px] border border-slate-200 bg-[#F7FBFF] p-8 text-slate-600"
          >
            {loading ? t("loadingArticles") : error || t("noArticlesFound")}
          </div>
        </section>
        <NewsletterSection />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      <MarketTicker />

      <section className="bg-white px-4 pb-14 pt-2 sm:px-6 sm:pt-2.5 lg:px-8 lg:pb-16">
        <div className="homepage-news-layout mx-auto max-w-[1280px]">
          <div className="homepage-news-main">
            <EditorialHero articles={articles} />

            <div className="mt-8">
              <FeaturedArticlesCarousel articles={featuredCarouselArticles} />
            </div>

            <div className="space-y-14 bg-[#f8fafc] pb-2 pt-10">
              <LatestArticlesGrid
                articles={homeArticles}
                heading={t("latestArticles")}
              />
              <ShrimpFarmingGrid articles={articles} />
              <EventsGrid
                lead={homepageEvents.lead}
                supporting={homepageEvents.supporting}
              />
            </div>
          </div>

          <aside className="homepage-news-sidebar">
            <NewsSidebar articles={homeArticles} />
          </aside>
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
