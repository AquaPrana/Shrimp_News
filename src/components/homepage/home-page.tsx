"use client";

import { AskPranaSection } from "@/components/homepage/ask-prana-section";
import { EditorialHero } from "@/components/homepage/editorial-hero";
import { LatestArticlesGrid } from "@/components/homepage/latest-articles-grid";
import { MarketTicker } from "@/components/homepage/market-ticker";
import { NewsSidebar } from "@/components/homepage/news-sidebar";
import { NewsletterSection } from "@/components/homepage/newsletter-section";
import { ShrimpFarmingGrid } from "@/components/homepage/shrimp-farming-grid";
import { useLanguage } from "@/context/language-context";
import { useArticles } from "@/hooks/use-articles";
import type { PublicArticle } from "@/lib/article-types";

export function HomePage({
  initialArticles = [],
}: {
  initialArticles?: PublicArticle[];
}) {
  const { t, language } = useLanguage();
  const { articles: fetchedArticles, loading, error } = useArticles({
    limit: 60,
  });
  const articles =
    language === "en" && initialArticles.length > 0
      ? initialArticles
      : fetchedArticles;
  const featuredArticle = articles[0];

  const homeArticles = articles
    .filter((article) => article.slug !== featuredArticle?.slug)
    .slice(0, 12);

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

            <div className="space-y-14 bg-[#f8fafc] pb-2 pt-8">
              <LatestArticlesGrid
                articles={homeArticles}
                heading={t("latestArticles")}
              />
              <ShrimpFarmingGrid articles={articles} />
            </div>
          </div>

          <aside className="homepage-news-sidebar">
            <NewsSidebar articles={homeArticles} />
          </aside>
        </div>
      </section>

      <section
        id="ask-prana"
        className="relative scroll-mt-28 bg-white px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div
          className="home-reveal mx-auto max-w-[1340px]"
          style={{ animationDelay: "0.22s" }}
        >
          <AskPranaSection />
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
