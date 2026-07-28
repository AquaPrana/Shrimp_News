"use client";

import { Suspense } from "react";
import { ArticleGrid } from "@/components/articles/article-grid";
import { PageShell } from "@/components/layout/page-shell";
import type { TranslationKey } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { normalizeArticleTopic } from "@/lib/public-articles-shared";

function ArticlesContent({
  topic,
  query,
  initialArticles,
}: {
  topic: string | null;
  query: string | null;
  initialArticles: PublicArticle[];
}) {
  const eyebrowKey: TranslationKey | undefined = query
    ? undefined
    : topic === "india"
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
      hideTitleAndDescription={!topic && !query}
      customTitle={query ? `Search results for “${query}”` : undefined}
      customDescription={
        query ? "Matching articles from across Shrimp News." : undefined
      }
    >
      <ArticleGrid
        topic={topic}
        query={query}
        initialArticles={initialArticles}
      />
    </PageShell>
  );
}

export function ArticlesPageClient({
  topicParam,
  query = null,
  initialArticles,
}: {
  topicParam: string | null;
  query?: string | null;
  initialArticles: PublicArticle[];
}) {
  const topic = normalizeArticleTopic(topicParam);

  return (
    <Suspense fallback={null}>
      <ArticlesContent
        topic={topic}
        query={query}
        initialArticles={initialArticles}
      />
    </Suspense>
  );
}
