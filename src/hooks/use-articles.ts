"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";

/**
 * Fetches published articles for the active UI language.
 * Keeps the previous list visible while a language switch is in flight
 * so the homepage never flashes an empty English-only dataset incorrectly.
 */
export function useArticles(
  options: {
    topic?: string | null;
    category?: string;
    limit?: number;
  } = {},
  initialArticles: PublicArticle[] = [],
) {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<PublicArticle[]>(initialArticles);
  const [loading, setLoading] = useState(initialArticles.length === 0);
  const [error, setError] = useState("");
  const topic = options.topic || "";
  const category = options.category || "";
  const limit = options.limit || 60;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        language,
        limit: String(limit),
      });
      if (topic) params.set("topic", topic);
      if (category) params.set("category", category);

      try {
        const response = await fetch(`/api/articles?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || t("articlesLoadError"));
        }
        if (!controller.signal.aborted) {
          setArticles(data.articles || []);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        if (!controller.signal.aborted) {
          setError(t("articlesLoadError"));
          if (language === "en" && initialArticles.length > 0) {
            setArticles(initialArticles);
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
    // initialArticles is only a cold-start fallback for English SSR.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, topic, category, limit, t]);

  return { articles, loading, error };
}
