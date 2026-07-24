"use client";

import { ArticleCard } from "@/components/homepage/article-card";
import {
  useLanguage,
  type TranslationKey,
} from "@/context/language-context";
import { useArticles } from "@/hooks/use-articles";
import type { PublicArticle } from "@/lib/article-types";
import { TOPIC_TRANSLATION_KEYS } from "@/lib/public-articles-shared";

const REGION_TOPICS = new Set([
  "india",
  "global",
  "national",
  "international",
]);

function safeDisplayLabel(value: unknown, translationKey?: string) {
  if (typeof value !== "string") return "";

  const label = value.trim();
  if (
    !label ||
    label === translationKey ||
    /^(undefined|null|\[object Object\])$/i.test(label)
  ) {
    return "";
  }

  return label;
}

export function ArticleGrid({
  topic,
  articles,
  initialArticles = [],
}: {
  topic?: string | null;
  articles?: PublicArticle[];
  initialArticles?: PublicArticle[];
}) {
  const { t, language } = useLanguage();
  const shouldFetch = !articles;
  const { articles: fetched, loading, error } = useArticles({
    topic: shouldFetch ? topic : undefined,
    limit: 60,
  });
  const list =
    articles ??
    (language === "en" && initialArticles.length > 0
      ? initialArticles
      : fetched);

  if (shouldFetch && loading && list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-[#F7FBFF] p-6 text-slate-600 sm:rounded-[28px] sm:p-8">
        Loading articles…
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
        {t("noArticlesFound")}
      </div>
    );
  }

  const topicTranslationKey = topic
    ? TOPIC_TRANSLATION_KEYS[topic]
    : undefined;
  const topicLabel = topicTranslationKey
    ? safeDisplayLabel(
        t(topicTranslationKey as TranslationKey),
        topicTranslationKey,
      )
    : "";
  const showTopicLabel = Boolean(
    topic && !REGION_TOPICS.has(topic) && topicLabel,
  );

  return (
    <div className="space-y-6">
      {showTopicLabel ? (
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff6a3d]">
          {topicLabel}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}

export { isArticleTopic } from "@/lib/public-articles-shared";
