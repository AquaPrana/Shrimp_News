"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { formatArticleDate } from "@/lib/format-date";
import { baseSlug } from "@/lib/public-articles-shared";

const FALLBACK = "/images/articles/ArticleImage.jpeg";
const AUTO_MS = 4500;
const TRANSITION_MS = 480;
const GAP_PX = 16;

function isValidFeaturedArticle(article: PublicArticle) {
  return Boolean(
    article.title?.trim() &&
      article.slug?.trim() &&
      (article.publishedAt || article.createdAt),
  );
}

function useVisibleCount() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      if (width < 640) setVisible(1);
      else if (width < 1024) setVisible(2);
      else setVisible(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visible;
}

function FeaturedCarouselCard({ article }: { article: PublicArticle }) {
  const { t, language } = useLanguage();

  return (
    <article className="group min-w-0">
      <Link
        href={`/articles/${baseSlug(article.slug)}`}
        className="block"
        aria-label={`${t("readArticle")} ${article.title}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <ArticleCoverImage
            src={article.featuredImageUrl || FALLBACK}
            alt={article.featuredImageAlt || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <h3 className="article-title mt-3 line-clamp-3 min-h-[3.9em] text-[14px] font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0B4F7A] sm:text-[15px]">
          {article.title}
        </h3>
        <time className="mt-2 block text-[11px] text-slate-500 sm:text-xs">
          {formatArticleDate(
            article.publishedAt || article.createdAt,
            language,
          )}
        </time>
      </Link>
    </article>
  );
}

export function FeaturedArticlesCarousel({
  articles,
}: {
  articles: PublicArticle[];
}) {
  const { t } = useLanguage();
  const visible = useVisibleCount();

  // Preserve the caller-provided order exactly (curated Featured list).
  const items = articles.filter((article) => isValidFeaturedArticle(article));

  const count = items.length;
  const canSlide = count > visible;

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  // Logical position within 0..count-1, rendered on the middle clone strip.
  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);

  const measure = useCallback(() => {
    setViewportWidth(viewportRef.current?.clientWidth ?? 0);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    setIndex(0);
    setEnableTransition(false);
    setLocked(false);
    const id = window.setTimeout(() => setEnableTransition(true), 40);
    return () => window.clearTimeout(id);
  }, [visible, count]);

  const slideWidth =
    visible > 0 && viewportWidth > 0
      ? (viewportWidth - GAP_PX * (visible - 1)) / visible
      : 0;
  const step = slideWidth > 0 ? slideWidth + GAP_PX : 0;

  // Middle copy starts at `count`; current slide offset is count + index.
  const trackOffset = canSlide && step > 0 ? (count + index) * step : 0;

  const goNext = useCallback(() => {
    if (!canSlide || locked) return;
    setLocked(true);
    setEnableTransition(true);
    setIndex((value) => value + 1);
  }, [canSlide, locked]);

  const goPrev = useCallback(() => {
    if (!canSlide || locked) return;
    setLocked(true);
    setEnableTransition(true);
    setIndex((value) => value - 1);
  }, [canSlide, locked]);

  function handleTransitionEnd() {
    if (!canSlide) {
      setLocked(false);
      return;
    }

    if (index >= count) {
      setEnableTransition(false);
      setIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setEnableTransition(true);
          setLocked(false);
        });
      });
      return;
    }

    if (index < 0) {
      setEnableTransition(false);
      setIndex(count - 1);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setEnableTransition(true);
          setLocked(false);
        });
      });
      return;
    }

    setLocked(false);
  }

  useEffect(() => {
    if (!canSlide || paused || locked) return;
    const timer = window.setInterval(() => {
      goNext();
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [canSlide, paused, locked, goNext]);

  if (count === 0) {
    return (
      <section className="min-w-0 pt-2" aria-label={t("featured")}>
        <div className="mb-5 flex items-center border-b-2 border-[#0B4F7A]">
          <h2 className="bg-[#0B4F7A] px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white sm:text-base">
            {t("featured")}
          </h2>
        </div>
        <p className="py-6 text-sm text-slate-500">No articles available.</p>
      </section>
    );
  }

  const trackItems = canSlide ? [...items, ...items, ...items] : items;

  return (
    <section
      className="min-w-0 overflow-x-hidden pt-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={t("featured")}
    >
      <div className="mb-5 flex items-center border-b-2 border-[#0B4F7A]">
        <h2 className="bg-[#0B4F7A] px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white sm:text-base">
          {t("featured")}
        </h2>
      </div>

      <div className="relative min-w-0">
        <div ref={viewportRef} className="min-w-0 overflow-hidden">
          <div
            className="flex"
            style={{
              gap: `${GAP_PX}px`,
              transform:
                canSlide && step > 0
                  ? `translate3d(-${trackOffset}px, 0, 0)`
                  : undefined,
              transition: enableTransition
                ? `transform ${TRANSITION_MS}ms ease-out`
                : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {trackItems.map((article, trackIndex) => (
              <div
                key={`featured-carousel-${article.slug}-${trackIndex}`}
                className="min-w-0 shrink-0"
                style={{
                  width:
                    slideWidth > 0
                      ? `${slideWidth}px`
                      : `calc((100% - ${(visible - 1) * GAP_PX}px) / ${visible})`,
                }}
              >
                <FeaturedCarouselCard article={article} />
              </div>
            ))}
          </div>
        </div>

        {canSlide ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={locked}
              aria-label="Previous featured articles"
              className="absolute left-2 top-[40%] z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-300 bg-white text-[#0B3A6E] shadow-[0_4px_14px_rgba(15,23,42,0.16)] transition hover:border-[#0B4F7A] hover:bg-[#0B4F7A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:left-3 sm:h-11 sm:w-11"
            >
              <ChevronLeft size={20} className="sm:hidden" />
              <ChevronLeft size={22} className="hidden sm:block" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={locked}
              aria-label="Next featured articles"
              className="absolute right-2 top-[40%] z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-300 bg-white text-[#0B3A6E] shadow-[0_4px_14px_rgba(15,23,42,0.16)] transition hover:border-[#0B4F7A] hover:bg-[#0B4F7A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:right-3 sm:h-11 sm:w-11"
            >
              <ChevronRight size={20} className="sm:hidden" />
              <ChevronRight size={22} className="hidden sm:block" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
