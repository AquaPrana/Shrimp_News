"use client";

import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage, type CopyKey } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";

export function CategoryArticlesView({
  eyebrowKey,
  titleKey,
  descriptionKey,
  bodyKey,
  topic,
  initialArticles,
}: {
  eyebrowKey: CopyKey;
  titleKey: CopyKey;
  descriptionKey: CopyKey;
  bodyKey: CopyKey;
  topic: string;
  initialArticles: PublicArticle[];
}) {
  const { t } = useLanguage();

  return (
    <PageShell
      eyebrowKey={eyebrowKey}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
    >
      <div className="space-y-8">
        <div className={`${PAGE_CONTENT_PANEL_CLASS} whitespace-pre-line`}>
          {t(bodyKey)}
        </div>
        <ArticleGrid topic={topic} initialArticles={initialArticles} />
      </div>
    </PageShell>
  );
}
