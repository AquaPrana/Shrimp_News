"use client";

import { use, useEffect, useState } from "react";
import { ArticleForm } from "@/components/admin/article-form";
import type { AdminArticle } from "@/lib/article-types";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/admin/articles/${id}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load article.");
        setArticle(body.article);
      } catch (value) {
        if ((value as Error).name !== "AbortError") setError(value instanceof Error ? value.message : "Unable to load article.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  if (loading) return <div role="status" className="rounded-2xl border bg-white p-10 text-center">Loading article…</div>;
  if (error || !article) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error || "Article not found."}</div>;
  return <ArticleForm article={article} />;
}
