"use client";

import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage } from "@/context/language-context";
import { readingTime, type PublicArticle } from "@/lib/article-types";
import { baseSlug } from "@/lib/public-articles-shared";

export function ArticleCard({ article }: { article: PublicArticle }) {
  const { t } = useLanguage();
  return (
    <article className="market-floating-card h-full overflow-hidden rounded-[24px] border border-cyan-400/40 bg-gradient-to-br from-white via-white to-sky-50 shadow-[0_16px_40px_rgba(11,79,122,0.12)]">
      <Link href={`/articles/${baseSlug(article.slug)}`} className="flex h-full flex-col" aria-label={`${t("readArticle")}: ${article.title}`}>
        <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-sky-50">
          <ArticleCoverImage
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-center"
          />
        </div>
        <div className="flex flex-1 flex-col space-y-3 p-4 sm:space-y-4 sm:p-6">
          <div className="flex items-center justify-between gap-3"><span className="inline-flex rounded-full border border-orange-300/50 bg-orange-50 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-orange-600">{article.category}</span><span className="shrink-0 text-xs text-slate-500">{readingTime(article.content)}</span></div>
          <h3 className="text-lg font-semibold text-[#0B3A6E] sm:text-xl">{article.title}</h3>
          <div className="mt-auto flex items-center justify-between gap-4"><span className="text-sm font-semibold text-orange-500 transition hover:text-orange-600">{t("readArticle")}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">Article</span></div>
        </div>
      </Link>
    </article>
  );
}
