"use client";

import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage, type TranslationKey } from "@/context/language-context";
import type { ArticleTopic } from "@/data/articles";

function CategoryArticlesPage({
  eyebrowKey,
  titleKey,
  descriptionKey,
  bodyKey,
  topic,
}: {
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  bodyKey: TranslationKey;
  topic: ArticleTopic;
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
        <ArticleGrid topic={topic} />
      </div>
    </PageShell>
  );
}

export default function HealthPage() {
  return (
    <CategoryArticlesPage
      eyebrowKey="healthEyebrow"
      titleKey="healthTitle"
      descriptionKey="healthDescription"
      bodyKey="healthBody"
      topic="shrimp-health"
    />
  );
}
