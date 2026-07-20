"use client";

import { Suspense } from "react";
import { ArticleGrid, isArticleTopic } from "@/components/articles/article-grid";
import { PageShell } from "@/components/layout/page-shell";
import type { TranslationKey } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";

function ArticlesContent({
  topic,
  initialArticles,
}: {
  topic: string | null;
  initialArticles: PublicArticle[];
}) {
  const eyebrowKey: TranslationKey | undefined =
    topic === "national"
      ? "india"
      : topic === "international"
        ? "global"
        : "articlesEyebrow";

  const titleKey: TranslationKey =
    topic === "national"
      ? "newsIndiaTitle"
      : topic === "international"
        ? "newsGlobalTitle"
        : "articlesTitle";

  const descriptionKey: TranslationKey =
    topic === "national"
      ? "newsIndiaDescription"
      : topic === "international"
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
  const topic = isArticleTopic(topicParam) ? topicParam : null;

  return (
    <Suspense fallback={null}>
      <ArticlesContent topic={topic} initialArticles={initialArticles} />
    </Suspense>
  );
}
