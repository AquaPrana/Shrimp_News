"use client";

import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { formatArticleDate } from "@/lib/format-date";
import { baseSlug } from "@/lib/public-articles-shared";

function publishedTime(article: PublicArticle) {
  return new Date(article.publishedAt || article.createdAt).getTime();
}

export function ShrimpFarmingGrid({ articles }: { articles: PublicArticle[] }) {
  const { t, language } = useLanguage();
  const farmingArticles = articles
    .filter((article) => article.category === "Shrimp Farming")
    .sort((a, b) => publishedTime(b) - publishedTime(a))
    .slice(0, 5);
  const lead = farmingArticles[0];
  const supporting = farmingArticles.slice(1);

  if (!lead) return null;

  return (
    <section className="min-w-0">
      <div className="mb-7 flex items-end justify-between border-b-2 border-[#0B4F7A]">
        <h2 className="bg-[#0B4F7A] px-5 py-3 text-base font-black uppercase tracking-[0.08em] text-white sm:text-lg">
          {t("shrimpFarming")}
        </h2>
        <Link
          href="/farming"
          className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#0B4F7A] transition hover:text-[#ff5a2f] hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <article className="group min-w-0">
          <Link href={`/articles/${baseSlug(lead.slug)}`} className="block">
            <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
              <ArticleCoverImage
                src={lead.featuredImageUrl}
                alt={lead.featuredImageAlt || lead.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                sizes="(max-width: 768px) 100vw, 38vw"
              />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold leading-tight text-slate-900 transition-colors group-hover:text-[#0B4F7A]">
              {lead.title}
            </h3>
            <time className="mt-2 block text-xs text-slate-500">
              {formatArticleDate(lead.publishedAt || lead.createdAt, language)}
            </time>
            {lead.excerpt ? (
              <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
                {lead.excerpt}
              </p>
            ) : null}
          </Link>
        </article>

        <div className="min-w-0 divide-y divide-slate-200">
          {supporting.map((article) => (
            <article
              key={`farming-list-${article.slug}`}
              className="group py-3 first:pt-0 last:pb-0"
            >
              <Link
                href={`/articles/${baseSlug(article.slug)}`}
                className="grid grid-cols-[128px_minmax(0,1fr)] gap-4 sm:grid-cols-[150px_minmax(0,1fr)] md:grid-cols-[128px_minmax(0,1fr)] xl:grid-cols-[145px_minmax(0,1fr)]"
              >
                <div className="relative h-[88px] overflow-hidden bg-slate-100 sm:h-[96px]">
                  <ArticleCoverImage
                    src={article.featuredImageUrl}
                    alt={article.featuredImageAlt || article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 150px, 145px"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-3 text-sm font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0B4F7A] sm:text-base">
                    {article.title}
                  </h3>
                  <time className="mt-2 block text-xs text-slate-500">
                    {formatArticleDate(
                      article.publishedAt || article.createdAt,
                      language,
                    )}
                  </time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
