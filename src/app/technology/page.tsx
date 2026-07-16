"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleGrid } from "@/components/articles/article-grid";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";

function TechnologyContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const topic =
    searchParams.get("topic") === "research" ? "research" : "technology";

  return (
    <PageShell
      eyebrowKey="techEyebrow"
      titleKey="techTitle"
      descriptionKey="techDescription"
    >
      <div className="space-y-8">
        <div className={`${PAGE_CONTENT_PANEL_CLASS} whitespace-pre-line`}>
          {t("techBody")}
        </div>
        <ArticleGrid topic={topic} />
      </div>
    </PageShell>
  );
}

export default function TechnologyPage() {
  return (
    <Suspense fallback={null}>
      <TechnologyContent />
    </Suspense>
  );
}
