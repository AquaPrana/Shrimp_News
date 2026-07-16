"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArticleGrid, isArticleTopic } from "@/components/articles/article-grid";
import { PageShell } from "@/components/layout/page-shell";
import type { TranslationKey } from "@/context/language-context";

function ArticlesContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const topic = isArticleTopic(topicParam) ? topicParam : null;

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
    >
      <ArticleGrid topic={topic} />
    </PageShell>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesContent />
    </Suspense>
  );
}
