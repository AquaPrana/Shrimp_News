"use client";

import {
  getArticlesByTopic,
  getLocalized,
  launchArticles,
  TOPIC_LABELS,
  type Article,
  type ArticleTopic,
} from "@/data/articles";
import { ArticleCard } from "@/components/homepage/article-card";
import { useLanguage } from "@/context/language-context";

function isArticleTopic(value: string | null): value is ArticleTopic {
  return (
    value === "national" ||
    value === "international" ||
    value === "domestic-consumption" ||
    value === "shrimp-farming" ||
    value === "shrimp-health" ||
    value === "technology" ||
    value === "research" ||
    value === "shrimp-prices" ||
    value === "markets-industry"
  );
}

export function ArticleGrid({
  topic,
  articles,
}: {
  topic?: ArticleTopic | null;
  articles?: Article[];
}) {
  const { language, t } = useLanguage();
  const list =
    articles ??
    (topic && isArticleTopic(topic)
      ? getArticlesByTopic(topic)
      : launchArticles);

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-[#F7FBFF] p-6 text-slate-600 sm:rounded-[28px] sm:p-8">
        {t("noArticlesFound")}
      </div>
    );
  }

  const showTopicLabel =
    topic &&
    isArticleTopic(topic) &&
    topic !== "national" &&
    topic !== "international";

  return (
    <div className="space-y-6">
      {showTopicLabel ? (
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff6a3d]">
          {getLocalized(TOPIC_LABELS[topic], language)}
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

export { isArticleTopic };
