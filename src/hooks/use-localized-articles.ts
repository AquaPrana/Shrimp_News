"use client";

import { useMemo } from "react";
import { useLanguage } from "@/context/language-context";
import { getLocalizedArticle } from "@/lib/article-localization";
import type { ArticleLanguage, PublicArticle } from "@/lib/article-types";

/**
 * Maps PublicArticle rows to the active UI language.
 * Call signature matches existing usage: useLocalizedArticles(articles)
 * Optional second argument overrides the language context.
 */
export function useLocalizedArticles(
  articles: PublicArticle[],
  selectedLanguage?: ArticleLanguage,
): PublicArticle[] {
  const { language: contextLanguage } = useLanguage();
  const language = selectedLanguage ?? contextLanguage;

  return useMemo(
    () =>
      articles.map((article) => {
        // API returns one language row per article. Map into flat fields
        // so getLocalizedArticle can apply strict EN / TE / HI selection.
        const localized = getLocalizedArticle(
          {
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            titleEn: article.language === "en" ? article.title : undefined,
            summaryEn: article.language === "en" ? article.excerpt : undefined,
            contentEn: article.language === "en" ? article.content : undefined,
            titleTe: article.language === "te" ? article.title : undefined,
            summaryTe: article.language === "te" ? article.excerpt : undefined,
            contentTe: article.language === "te" ? article.content : undefined,
            titleHi: article.language === "hi" ? article.title : undefined,
            summaryHi: article.language === "hi" ? article.excerpt : undefined,
            contentHi: article.language === "hi" ? article.content : undefined,
          },
          language,
        );

        return {
          ...article,
          title: localized.title || article.title,
          excerpt: localized.summary || article.excerpt,
          content: localized.content || article.content,
          featuredImageAlt: localized.title || article.featuredImageAlt,
          seoTitle: localized.title || article.seoTitle,
          seoDescription: localized.summary || article.seoDescription,
        } satisfies PublicArticle;
      }),
    [articles, language],
  );
}
