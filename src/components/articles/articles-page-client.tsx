"use client";

import { Suspense } from "react";
import { ArticleGrid } from "@/components/articles/article-grid";
import { PageShell } from "@/components/layout/page-shell";
import type { TranslationKey } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { normalizeArticleTopic } from "@/lib/public-articles-shared";

function ArticlesContent({
  topic,
  initialArticles,
}: {
  topic: string | null;
  initialArticles: PublicArticle[];
}) {
  const eyebrowKey: TranslationKey | undefined =
    topic === "india"
      ? "india"
      : topic === "global"
        ? "global"
        : "articlesEyebrow";

  const titleKey: TranslationKey =
    topic === "india"
      ? "newsIndiaTitle"
      : topic === "global"
        ? "newsGlobalTitle"
        : "articlesTitle";

  const descriptionKey: TranslationKey =
    topic === "india"
      ? "newsIndiaDescription"
      : topic === "global"
        ? "newsGlobalDescription"
        : "articlesDescription";

  return (
    <PageShell
      eyebrowKey={eyebrowKey}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      hideTitleAndDescription={!topic}
    >
      <ArticleGrid topic={topic} initialArticles={initialArticles} />
    </PageShell>
  );
}

export function ArticlesPageClient({
  topicParam,
  initialArticles,
}: {
  topicParam: string | null;
  initialArticles: PublicArticle[];
}) {
  const topic = normalizeArticleTopic(topicParam);

  return (
    <Suspense fallback={null}>
      <ArticlesContent topic={topic} initialArticles={initialArticles} />
    </Suspense>
  );
}
