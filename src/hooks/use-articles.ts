"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";

/**
 * Fetches published articles once (all language fields included).
 * Language switching does NOT refetch — useLocalizedArticles selects fields instantly.
 */
export function useArticles(
  options: {
    topic?: string | null;
    category?: string;
    limit?: number;
  } = {},
  initialArticles: PublicArticle[] = [],
) {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<PublicArticle[]>(initialArticles);
  const [loading, setLoading] = useState(initialArticles.length === 0);
  const [error, setError] = useState("");
  const topic = options.topic || "";
  const category = options.category || "";
  const limit = options.limit || 60;
  const skipInitialFetchRef = useRef(initialArticles.length > 0);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
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
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [topic, category, limit, t]);

  return { articles, loading, error };
}
