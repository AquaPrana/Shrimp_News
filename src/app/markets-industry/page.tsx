"use client";

import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";

export default function MarketsIndustryPage() {
  const { t } = useLanguage();

  return (
    <PageShell
      eyebrowKey="marketsEyebrow"
      titleKey="marketsPageTitle"
      descriptionKey="marketsPageDescription"
    >
      <div className="space-y-8">
        <div className={`${PAGE_CONTENT_PANEL_CLASS} whitespace-pre-line`}>
          {t("marketsBody")}
        </div>
        <ArticleGrid topic="markets-industry" />
      </div>
    </PageShell>
  );
}
