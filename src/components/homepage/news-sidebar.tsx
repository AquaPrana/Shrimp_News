"use client";

import { useState } from "react";
import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { formatArticleDate } from "@/lib/format-date";
import { baseSlug } from "@/lib/public-articles-shared";

const FALLBACK = "/images/articles/ArticleImage.jpeg";

export function NewsSidebar({ articles }: { articles: PublicArticle[] }) {
  const { t, language } = useLanguage();
  const [tab, setTab] = useState<"recent" | "popular">("recent");
  const recent = articles.slice(0, 5);
  const popular = [...articles]
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, 5);
  const displayed = tab === "recent" ? recent : popular;

  return (
    <div className="w-full border border-slate-200 bg-white">
      <div className="grid grid-cols-2 border-b border-slate-200">
        {(["recent", "popular"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`relative px-5 py-5 text-sm font-black uppercase tracking-[0.08em] transition ${
              tab === value
                ? "bg-slate-50 text-[#0B4F7A]"
                : "text-slate-900 hover:bg-slate-50"
            }`}
          >
            {t(value)}
            {tab === value && (
              <span className="absolute inset-x-0 bottom-0 h-1 bg-[#0B4F7A]" />
            )}
          </button>
        ))}
      </div>
      <div className="relative px-5">
        <span className="absolute bottom-5 left-[10px] top-5 w-px bg-slate-200" />
        {displayed.map((article) => (
          <article
            key={`${tab}-${article.slug}`}
            className="group relative border-b border-slate-200 py-6 last:border-b-0"
          >
            <span className="absolute -left-[20px] top-8 h-3 w-3 rounded-full border-2 border-white bg-[#0B4F7A] ring-1 ring-slate-200" />
            <Link
              href={`/articles/${baseSlug(article.slug)}`}
              className="grid grid-cols-[116px_minmax(0,1fr)] gap-4"
            >
              <span className="relative h-[78px] overflow-hidden bg-slate-100">
                <ArticleCoverImage
                  src={article.featuredImageUrl || FALLBACK}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="116px"
                />
              </span>
              <span className="min-w-0">
                <span className="line-clamp-3 block text-[16px] font-extrabold leading-[1.3] text-slate-900 transition group-hover:text-[#0B4F7A]">
                  {article.title}
                </span>
                <span className="mt-2 block text-xs text-slate-400">
                  {formatArticleDate(
                    article.publishedAt || article.createdAt,
                    language,
                  )}
                </span>
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
