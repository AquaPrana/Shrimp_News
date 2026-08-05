"use client";

import { ArticleCard } from "@/components/homepage/article-card";
import {
  useLanguage,
  type CopyKey,
} from "@/context/language-context";
import { useArticles } from "@/hooks/use-articles";
import type { PublicArticle } from "@/lib/article-types";
import { TOPIC_LABELS } from "@/lib/public-articles-shared";

const REGION_TOPICS = new Set([
  "india",
  "global",
  "national",
  "international",
]);

function safeDisplayLabel(value: unknown, copyKey?: string) {
  if (typeof value !== "string") return "";

  const label = value.trim();
  if (
    !label ||
    label === copyKey ||
    /^(undefined|null|\[object Object\])$/i.test(label)
  ) {
    return "";
  }

  return label;
}

export function ArticleGrid({
  topic,
  query,
  headingKey,
  articles,
  initialArticles = [],
}: {
  topic?: string | null;
  query?: string | null;
  headingKey?: CopyKey;
  articles?: PublicArticle[];
  initialArticles?: PublicArticle[];
}) {
  const { t } = useLanguage();
  const shouldFetch = !articles;
  const { articles: fetched, loading, error } = useArticles(
    {
      topic: shouldFetch ? topic : undefined,
      q: shouldFetch ? query : undefined,
      limit: 60,
    },
    initialArticles,
  );
  const sourceList = articles ?? fetched;
  const list = sourceList;

  if (shouldFetch && loading && list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-[#F7FBFF] p-6 text-slate-600 sm:rounded-[28px] sm:p-8">
        {t("loadingArticles")}
      </div>
    );
  }

  if (shouldFetch && error && list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-[#F7FBFF] p-6 text-slate-600 sm:rounded-[28px] sm:p-8">
        {error}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-[#F7FBFF] p-6 text-slate-600 sm:rounded-[28px] sm:p-8">
        {query?.trim()
          ? `No articles found for “${query.trim()}”.`
          : t("noArticlesFound")}
      </div>
    );
  }

  const heading = headingKey
    ? safeDisplayLabel(t(headingKey), headingKey)
    : topic && REGION_TOPICS.has(topic)
      ? ""
      : safeDisplayLabel(topic ? TOPIC_LABELS[topic] : "");

  return (
    <div className="space-y-6">
      {heading ? (
        <h2 className="text-2xl font-black text-[#0B3A6E]">{heading}</h2>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
