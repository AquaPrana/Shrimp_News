"use client";

import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";

export default function FarmingPage() {
  const { t } = useLanguage();

  return (
    <PageShell
      eyebrowKey="farmingEyebrow"
      titleKey="farmingPageTitle"
      descriptionKey="farmingPageDescription"
    >
      <div className="space-y-8">
        <div className={`${PAGE_CONTENT_PANEL_CLASS} whitespace-pre-line`}>
          {t("farmingBody")}
        </div>
        <ArticleGrid topic="shrimp-farming" />
      </div>
    </PageShell>
  );
}
