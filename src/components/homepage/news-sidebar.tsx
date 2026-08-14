"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { formatArticleDate } from "@/lib/format-date";
import { baseSlug } from "@/lib/public-articles-shared";
import {
  selectPopularHomepageArticles,
  selectRecentHomepageArticles,
} from "@/lib/featured-homepage-articles";

const FALLBACK = "/images/articles/ArticleImage.jpeg";

function SidebarArticleCard({ article }: { article: PublicArticle }) {
  const { language } = useLanguage();

  return (
    <article className="homepage-news-sidebar-item group">
      <span className="homepage-news-sidebar-dot" aria-hidden="true" />
      <Link
        href={`/articles/${baseSlug(article.slug)}`}
        className="homepage-news-sidebar-link"
      >
        <span className="homepage-news-sidebar-image">
          <ArticleCoverImage
            src={article.featuredImageUrl || FALLBACK}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="116px"
          />
        </span>
        <span className="homepage-news-sidebar-content">
          <span className="homepage-news-sidebar-title article-title">
            {article.title}
          </span>
          <span className="homepage-news-sidebar-date">
            {formatArticleDate(
              article.publishedAt || article.createdAt,
              language,
            )}
          </span>
        </span>
      </Link>
    </article>
  );
}

export function NewsSidebar({ articles }: { articles: PublicArticle[] }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"recent" | "popular">("recent");
  const recentArticles = useMemo(
    () => selectRecentHomepageArticles(articles, 5),
    [articles],
  );
  const popularArticles = useMemo(
    () => selectPopularHomepageArticles(articles, 5),
    [articles],
  );
  const displayedArticles =
    activeTab === "recent" ? recentArticles : popularArticles;

  return (
    <div className="homepage-news-sidebar-panel w-full border border-slate-200 bg-white">
      <div className="homepage-news-sidebar-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={`homepage-news-sidebar-tab${
            activeTab === "recent" ? " active" : ""
          }`}
        >
          {t("recent")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("popular")}
          className={`homepage-news-sidebar-tab${
            activeTab === "popular" ? " active" : ""
          }`}
        >
          {t("popular")}
        </button>
      </div>
      <div
        className={`homepage-news-sidebar-list${
          displayedArticles.length === 0 ? " is-empty" : ""
        }`}
      >
        {displayedArticles.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">No articles available.</p>
        ) : (
          displayedArticles.map((article) => (
            <SidebarArticleCard key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  );
}
