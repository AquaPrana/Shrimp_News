"use client";

import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";

export default function DomesticConsumptionPage() {
  const { t } = useLanguage();

  return (
    <PageShell
      eyebrowKey="domesticEyebrow"
      titleKey="domesticPageTitle"
      descriptionKey="domesticPageDescription"
    >
      <div className="space-y-8">
        <div className={`${PAGE_CONTENT_PANEL_CLASS} whitespace-pre-line`}>
          {t("domesticBody")}
        </div>
        <ArticleGrid topic="domestic-consumption" />
      </div>
    </PageShell>
  );
}
