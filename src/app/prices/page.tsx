"use client";

import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";

export default function PricesPage() {
  const { t } = useLanguage();

  return (
    <PageShell
      eyebrowKey="pricesEyebrow"
      titleKey="pricesTitle"
      descriptionKey="pricesDescription"
    >
      <div className="space-y-8">
        <div className={`${PAGE_CONTENT_PANEL_CLASS} whitespace-pre-line`}>
          {t("pricesBody")}
        </div>
        <ArticleGrid topic="shrimp-prices" />
      </div>
    </PageShell>
  );
}
