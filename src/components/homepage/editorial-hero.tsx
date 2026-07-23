"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage, type TranslationKey } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { formatArticleDate } from "@/lib/format-date";
import {
  CATEGORY_TRANSLATION_KEYS,
  baseSlug,
} from "@/lib/public-articles-shared";

const FALLBACK = "/images/articles/ArticleImage.jpeg";

export function EditorialHero({ articles }: { articles: PublicArticle[] }) {
  const { t, language } = useLanguage();
  const slides = articles.slice(0, 5);
  const usedSlugs = new Set(
    slides.map((article) => article.slug),
  );
  const featuredPool = articles.filter((article) => !usedSlugs.has(article.slug));
  const featured =
    featuredPool.length >= 3
      ? featuredPool.slice(0, 3)
      : articles.filter((article) => article.slug !== slides[0]?.slug).slice(0, 3);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timerRevision, setTimerRevision] = useState(0);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % slides.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [paused, slides.length, timerRevision]);

  if (!slides.length) return null;
  const previous = () => {
    setActive((value) => (value - 1 + slides.length) % slides.length);
    setTimerRevision((value) => value + 1);
  };
  const next = () => {
    setActive((value) => (value + 1) % slides.length);
    setTimerRevision((value) => value + 1);
  };
  const selectSlide = (index: number) => {
    setActive(index);
    setTimerRevision((value) => value + 1);
  };

  const categoryLabel = (category: string) => {
    const key = CATEGORY_TRANSLATION_KEYS[category];
    return key ? t(key as TranslationKey) : category;
  };

  return (
    <section className="overflow-x-hidden bg-white pb-8">
      <div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-black tracking-[-0.025em] text-[#0B3A6E] sm:text-3xl lg:text-[34px]">
                {t("welcomeTitle")}
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">
                {t("welcomeDescription")}
              </p>
            </div>

            <div
              className="group relative isolate h-[340px] min-w-0 overflow-hidden rounded-[18px] bg-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:h-[420px] xl:h-[480px]"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={(event) => {
                touchStart.current = event.touches[0]?.clientX ?? null;
                setPaused(true);
              }}
              onTouchEnd={(event) => {
                const end = event.changedTouches[0]?.clientX;
                if (
                  touchStart.current != null &&
                  end != null &&
                  Math.abs(end - touchStart.current) > 45
                ) {
                  if (end > touchStart.current) previous();
                  else next();
                }
                touchStart.current = null;
                setPaused(false);
              }}
            >
              <div
                className="flex h-full w-full min-w-0 transition-transform duration-700 ease-out"
                style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
              >
                {slides.map((article, index) => (
                  <Link
                    key={article.slug}
                    href={`/articles/${baseSlug(article.slug)}`}
                    className="relative h-full w-full min-w-full shrink-0 overflow-hidden"
                    aria-hidden={index !== active}
                    tabIndex={index === active ? 0 : -1}
                  >
                    <ArticleCoverImage
                      src={article.featuredImageUrl || FALLBACK}
                      alt={article.featuredImageAlt || article.title}
                      fill
                      priority={index === 0}
                      className="object-cover transition-transform duration-[1400ms] group-hover:scale-[1.025]"
                      sizes="(max-width: 1280px) 100vw, 68vw"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-6 pb-12 text-white sm:p-8 sm:pb-14 lg:p-9 lg:pb-14">
                      <span className="mb-2.5 inline-flex bg-[#0B4F7A] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] sm:text-[11px]">
                        {categoryLabel(article.category)}
                      </span>
                      <span className="line-clamp-3 block max-w-[90%] text-[24px] font-extrabold leading-[1.12] tracking-[-0.02em] sm:text-[30px] lg:text-[34px]">
                        {article.title}
                      </span>
                      <span className="mt-3 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/75 sm:text-xs">
                        {formatArticleDate(
                          article.publishedAt || article.createdAt,
                          language,
                        )}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previous}
                    className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-[#0B4F7A] sm:left-4"
                    aria-label="Previous featured article"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-[#0B4F7A] sm:right-4"
                    aria-label="Next featured article"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-5 right-5 flex gap-2 sm:right-8">
                    {slides.map((article, index) => (
                      <button
                        key={`indicator-${article.slug}`}
                        type="button"
                        onClick={() => selectSlide(index)}
                        className={`h-1.5 transition-all ${
                          index === active
                            ? "w-8 bg-white"
                            : "w-4 bg-white/45 hover:bg-white/75"
                        }`}
                        aria-label={`Show featured article ${index + 1}`}
                        aria-current={index === active ? "true" : undefined}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {featured.length > 0 ? (
              <div className="min-w-0">
                <div className="mb-3 flex items-center border-b border-slate-300">
                  <h2 className="bg-[#0B4F7A] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-white">
                    Featured
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {featured.map((article) => (
                    <article key={`featured-${article.slug}`} className="group min-w-0">
                      <Link
                        href={`/articles/${baseSlug(article.slug)}`}
                        className="block"
                        aria-label={`Read ${article.title}`}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                          <ArticleCoverImage
                            src={article.featuredImageUrl || FALLBACK}
                            alt={article.featuredImageAlt || article.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 220px"
                          />
                        </div>
                        <h3 className="mt-2 line-clamp-3 text-[13px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#0B4F7A]">
                          {article.title}
                        </h3>
                        <time className="mt-1.5 block text-[11px] text-slate-500">
                          {formatArticleDate(
                            article.publishedAt || article.createdAt,
                            language,
                          )}
                        </time>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </section>
  );
}
