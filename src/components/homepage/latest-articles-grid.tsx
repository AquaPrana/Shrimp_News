"use client";

import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage, type TranslationKey } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { formatArticleDate } from "@/lib/format-date";
import {
  CATEGORY_TRANSLATION_KEYS,
  baseSlug,
} from "@/lib/public-articles-shared";

export function LatestArticlesGrid({
  articles,
  heading,
}: {
  articles: PublicArticle[];
  heading: string;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="min-w-0">
      <div className="mb-7 flex items-end justify-between border-b-2 border-[#0B4F7A]">
        <h2 className="bg-[#0B4F7A] px-5 py-3 text-base font-black uppercase tracking-[0.08em] text-white sm:text-lg">
          {heading}
        </h2>
        <Link
          href="/articles"
          className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#0B4F7A] transition hover:text-[#ff5a2f] hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {articles.slice(0, 4).map((article, index) => {
          const categoryKey = CATEGORY_TRANSLATION_KEYS[article.category];
          const categoryLabel = categoryKey
            ? t(categoryKey as TranslationKey)
            : article.category;
          return (
            <article
              key={`latest-grid-${article.slug}`}
              className="home-reveal group relative aspect-[3/2] min-w-0 overflow-hidden bg-slate-900"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <Link
                href={`/articles/${baseSlug(article.slug)}`}
                className="absolute inset-0 block"
                aria-label={`${t("readArticle")} ${article.title}`}
              >
                <ArticleCoverImage
                  src={article.featuredImageUrl}
                  alt={article.featuredImageAlt || article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw"
                />
                <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/15" />

                <span className="absolute inset-x-0 bottom-0 flex min-h-[62%] flex-col items-center justify-end p-5 text-center text-white sm:p-6">
                  <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                    {categoryLabel}
                  </span>
                  <span className="line-clamp-3 text-lg font-extrabold leading-snug drop-shadow-md sm:text-xl">
                    {article.title}
                  </span>
                  <span className="mt-3 text-xs font-medium text-white/90">
                    {t("brandName")}
                    &nbsp;&nbsp; | &nbsp;&nbsp;
                    {formatArticleDate(
                      article.publishedAt || article.createdAt,
                      language,
                    )}
                  </span>
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
