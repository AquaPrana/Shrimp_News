"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getArticleBySlug,
  getArticleCover,
  getArticlesByTopic,
  getLocalized,
} from "@/data/articles";
import { useLanguage } from "@/context/language-context";
import { ArticleGrid } from "@/components/articles/article-grid";
import { PAGE_CONTENT_PANEL_CLASS } from "@/components/layout/page-shell";

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const article = getArticleBySlug(params.slug);

  if (!article) {
    return (
      <section className="overflow-x-hidden bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className={`mx-auto max-w-3xl ${PAGE_CONTENT_PANEL_CLASS}`}>
          {t("noArticlesFound")}
          <div className="mt-6">
            <Link href="/articles" className="font-semibold text-orange-500">
              {t("exploreArticles")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const cover = getArticleCover(article.slug);
  const relatedTopic = article.topics[0];
  const related = getArticlesByTopic(relatedTopic)
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  return (
    <section className="relative overflow-x-hidden bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />
      <div className="relative z-10 mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500 sm:text-sm">
            {getLocalized(article.category, language)}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
            {getLocalized(article.title, language)}
          </h1>
          {cover ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-sky-50 shadow-[0_18px_50px_rgba(11,79,122,0.14)] sm:rounded-[30px]">
              <Image
                src={cover}
                alt={getLocalized(article.title, language)}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover object-center"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[#ff6a3d]">
              {getLocalized(article.label, language)}
            </span>
            <span>{getLocalized(article.readingTime, language)}</span>
          </div>
          <p className="text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {getLocalized(article.excerpt, language)}
          </p>
        </div>

        <article className={PAGE_CONTENT_PANEL_CLASS}>
          <div className="space-y-5">
            {getLocalized(article.body, language)
              .split("\n\n")
              .map((paragraph, index) => {
                const isHeading =
                  paragraph.length < 90 &&
                  !paragraph.endsWith(".") &&
                  !paragraph.endsWith("?") &&
                  !paragraph.includes("\n");

                if (isHeading) {
                  return (
                    <h2
                      key={`${article.slug}-${index}`}
                      className="pt-2 text-xl font-semibold text-[#0B3A6E] sm:text-2xl"
                    >
                      {paragraph}
                    </h2>
                  );
                }

                return (
                  <p key={`${article.slug}-${index}`}>{paragraph}</p>
                );
              })}
          </div>
        </article>

        {related.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              {t("relatedArticles")}
            </h2>
            <ArticleGrid articles={related} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
