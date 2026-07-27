"use client";

import { useMemo } from "react";
import { useLanguage } from "@/context/language-context";
import { localizePublicArticle } from "@/lib/article-localization";
import type { ArticleLanguage, PublicArticle } from "@/lib/article-types";

/**
 * Instantly selects stored title/summary/content for the active language.
 * Does not fetch or call translation APIs.
 */
export function useLocalizedArticles(
  articles: PublicArticle[],
  selectedLanguage?: ArticleLanguage,
): PublicArticle[] {
  const { language: contextLanguage } = useLanguage();
  const language = selectedLanguage ?? contextLanguage;

  return useMemo(
    () => articles.map((article) => localizePublicArticle(article, language)),
    [articles, language],
  );
}
