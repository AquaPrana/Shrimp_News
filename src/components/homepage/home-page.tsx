"use client";

import Link from "next/link";
import { AskAquaGPTSection } from "@/components/homepage/ask-aqua-gpt-section";
import { HeroSection } from "@/components/homepage/hero-section";
import { MarketTicker } from "@/components/homepage/market-ticker";
import { ArticleCard } from "@/components/homepage/article-card";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { NewsletterSection } from "@/components/homepage/newsletter-section";
import { useLanguage } from "@/context/language-context";
import { useArticles } from "@/hooks/use-articles";
import { readingTime, type PublicArticle } from "@/lib/article-types";
import { baseSlug } from "@/lib/public-articles-shared";

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
  const featuredTitle = featuredArticle?.title || "";

  const homeArticles = articles
    .filter((article) => article.slug !== featuredArticle?.slug)
    .slice(0, 12);

  const farmingArticles = articles
    .filter(
      (article) =>
        article.category === "Shrimp Farming" ||
        article.category === "Shrimp Health",
    )
    .slice(0, 3);

  if (!featuredArticle) {
    return (
      <div className="min-h-full overflow-hidden bg-white">
        <MarketTicker />
        <HeroSection />
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div
            role="status"
            className="mx-auto max-w-[1340px] rounded-[24px] border border-slate-200 bg-[#F7FBFF] p-8 text-slate-600"
          >
            {loading ? "Loading articles…" : error || t("noArticlesFound")}
          </div>
        </section>
        <NewsletterSection />
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-hidden bg-white">
      <MarketTicker />

      <HeroSection featuredArticle={featuredArticle} />

      <section className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-orange-100/30 blur-[100px]" />

        <div
          className="home-reveal relative z-10 mx-auto grid max-w-[1340px] gap-14"
          style={{ animationDelay: "0.12s" }}
        >
          <article className="market-dashboard-card relative grid gap-8 overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#0B4F7A] p-8 shadow-[0_24px_70px_rgba(11,79,122,0.28)] lg:grid-cols-[1.4fr_0.9fr] xl:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_42%)]" />

            <div className="relative z-10 space-y-6">
              <span className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-xs uppercase tracking-[0.32em] text-orange-300">
                {featuredArticle.category}
              </span>

              <div className="space-y-4">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {featuredTitle}
                </h2>
                <p className="max-w-3xl text-base leading-8 text-cyan-50/85 sm:text-lg">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`/articles/${baseSlug(featuredArticle.slug)}`}
                  className="inline-flex rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-400"
                >
                  {t("readFeaturedStory")}
                </Link>
                <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-cyan-50/80">
                  {readingTime(featuredArticle.content)}
                </span>
              </div>
            </div>

            <div className="relative z-10 overflow-hidden rounded-[28px] border border-white/10 bg-[#03172d]">
              <ArticleCoverImage
                src={
                  featuredArticle.featuredImageUrl ||
                  "/images/articles/ArticleImage.jpeg"
                }
                alt={featuredTitle}
                width={900}
                height={700}
                className="h-full min-h-[280px] w-full object-cover transition-transform duration-700 hover:scale-[1.03] sm:min-h-[320px]"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </article>

          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-500">
                {t("latestArticles")}
              </p>
              <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
                {t("latestTitle")}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {t("latestDescription")}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {homeArticles.map((article, index) => (
                <div
                  key={article.slug}
                  className="home-reveal"
                  style={{ animationDelay: `${0.16 + index * 0.06}s` }}
                >
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="market-floating-card rounded-[24px] border border-cyan-300/20 bg-[#0B4F7A] p-8 shadow-[0_24px_70px_rgba(11,79,122,0.22)] transition duration-300 hover:-translate-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-300">
                {t("domesticConsumption")}
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                {t("domesticTitle")}
              </h3>
              <p className="mt-4 text-sm leading-7 text-cyan-50/85">
                {t("domesticDescription")}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <span className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-50">
                  {t("whyConsumptionLags")}
                </span>
                <span className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-50">
                  {t("healthNutritionStories")}
                </span>
              </div>
            </div>

            <div className="market-floating-card rounded-[24px] border border-cyan-300/20 bg-[#0B4F7A] p-8 shadow-[0_24px_70px_rgba(11,79,122,0.22)] transition duration-300 hover:-translate-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-300">
                {t("marketsLabel")}
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                {t("marketsTitle")}
              </h3>
              <p className="mt-4 text-sm leading-7 text-cyan-50/85">
                {t("marketsDescription")}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <span className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-50">
                  {t("farmgatePriceDrivers")}
                </span>
                <span className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-50">
                  {t("exportVsDomestic")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,122,61,0.08),transparent_40%)]" />
        <div
          className="home-reveal relative z-10 mx-auto max-w-[1340px] space-y-8"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-500">
              {t("farmingHealthLabel")}
            </p>
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl">
              {t("farmingTitle")}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {t("farmingDescription")}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {farmingArticles.map((article) => (
              <ArticleCard key={`farm-${article.slug}`} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="ask-prana"
        className="relative scroll-mt-28 overflow-hidden bg-white px-4 pb-16 sm:px-6 lg:px-8"
      >
        <div
          className="home-reveal mx-auto max-w-[1340px]"
          style={{ animationDelay: "0.22s" }}
        >
          <AskAquaGPTSection />
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
