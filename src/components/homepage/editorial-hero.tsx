"use client";

import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { getCategoryLabel } from "@/lib/article-formatting";
import { formatArticleDate } from "@/lib/format-date";
import { baseSlug } from "@/lib/public-articles-shared";

const FALLBACK = "/images/articles/ArticleImage.jpeg";

function FeaturedCard({
  article,
  priority,
  tall,
}: {
  article: PublicArticle;
  priority?: boolean;
  tall?: boolean;
}) {
  const { t, language } = useLanguage();

  return (
    <article
      className={`group relative h-full min-h-[220px] min-w-0 overflow-hidden bg-slate-900 sm:min-h-0 ${
        tall ? "sm:h-[300px]" : "sm:h-[260px]"
      }`}
    >
      <Link
        href={`/articles/${baseSlug(article.slug)}`}
        className="absolute inset-0 block"
        aria-label={`${t("readArticle")} ${article.title}`}
      >
        <ArticleCoverImage
          src={article.featuredImageUrl || FALLBACK}
          alt={article.featuredImageAlt || article.title}
          fill
          priority={priority}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 40vw"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 sm:text-[11px]">
            {getCategoryLabel(article.category, language)}
          </span>
          <span className="article-title line-clamp-2 block text-[15px] font-extrabold leading-snug tracking-[-0.015em] sm:text-[17px] lg:text-[18px]">
            {article.title}
          </span>
          <time className="mt-2 block text-[11px] font-medium uppercase tracking-[0.1em] text-white/75 sm:text-xs">
            {formatArticleDate(
              article.publishedAt || article.createdAt,
              language,
            )}
          </time>
        </span>
      </Link>
    </article>
  );
}

export function EditorialHero({ articles }: { articles: PublicArticle[] }) {
  const { t } = useLanguage();
  const featured = articles.slice(0, 4);
  const topRow = featured.slice(0, 2);
  const bottomRow = featured.slice(2, 4);

  if (!featured.length) return null;

  return (
    <section className="overflow-x-hidden bg-white pb-8">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-black tracking-[-0.025em] text-[#0B3A6E] sm:text-3xl lg:text-[34px]">
            {t("welcomeToShrimpNews")}
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">
            {t("welcomeDescription")}
          </p>
        </div>

        <div className="min-w-0 space-y-1">
          {/* Mobile: stack all cards. Desktop: staggered asymmetric rows. */}
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-[1.15fr_0.85fr]">
            {topRow.map((article, index) => (
              <FeaturedCard
                key={`hero-top-${article.slug}`}
                article={article}
                priority={index === 0}
                tall
              />
            ))}
          </div>

          {bottomRow.length > 0 ? (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-[0.85fr_1.15fr]">
              {bottomRow.map((article) => (
                <FeaturedCard
                  key={`hero-bottom-${article.slug}`}
                  article={article}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
