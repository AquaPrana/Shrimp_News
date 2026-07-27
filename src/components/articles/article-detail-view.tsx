"use client";

import Link from "next/link";
import { ArticleContentBody } from "@/components/articles/article-content-body";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { ArticleGrid } from "@/components/articles/article-grid";
import { PAGE_CONTENT_PANEL_CLASS } from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";
import { useLocalizedArticles } from "@/hooks/use-localized-articles";
import {
  readingTimeMinutes,
  type PublicArticle,
} from "@/lib/article-types";
import {
  formatReadTime,
  getCategoryLabel,
  localizePublicArticle,
} from "@/lib/article-localization";
import { isLegacyLaunchArticleSlug } from "@/lib/legacy-articles";
import { baseSlug } from "@/lib/public-articles-shared";

type ArticleDetailViewProps = {
  slug: string;
  initialArticle: PublicArticle;
  initialRelated: PublicArticle[];
};

export function ArticleDetailView({
  initialArticle,
  initialRelated,
}: ArticleDetailViewProps) {
  const { language, t } = useLanguage();
  const article = localizePublicArticle(initialArticle, language);
  const related = useLocalizedArticles(initialRelated, language);
  const cover = article.featuredImageUrl || "/images/articles/ArticleImage.jpeg";

  return (
    <section className="relative overflow-x-hidden bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />
      <div className="relative z-10 mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500 sm:text-sm">
            {getCategoryLabel(article.category, language)}
          </p>
          <h1 className="article-title text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-sky-50 shadow-[0_18px_50px_rgba(11,79,122,0.14)] sm:rounded-[30px]">
            <ArticleCoverImage
              src={cover}
              alt={article.featuredImageAlt || article.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover object-center"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[#ff6a3d]">
              {t("articleDetailEyebrow")}
            </span>
            <span>
              {formatReadTime(readingTimeMinutes(article.content), language)}
            </span>
          </div>
          {article.excerpt ? (
            <p className="text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {article.excerpt}
            </p>
          ) : null}
        </div>

        <article className={PAGE_CONTENT_PANEL_CLASS}>
          <ArticleContentBody
            content={article.content}
            compactLegacySpacing={isLegacyLaunchArticleSlug(article.slug)}
          />
        </article>

        {related.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              {t("relatedArticles")}
            </h2>
            <ArticleGrid articles={related} />
          </div>
        ) : null}

        <div>
          <Link href="/articles" className="font-semibold text-orange-500">
            ← {t("exploreArticles")}
          </Link>
        </div>
      </div>
    </section>
  );
}
