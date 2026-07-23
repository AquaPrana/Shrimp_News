"use client";

import { use, useEffect, useState } from "react";
import { ArticleForm } from "@/components/admin/article-form";
import type { AdminArticle } from "@/lib/article-types";

function stringField(
  value: Record<string, unknown>,
  names: string[],
): string | undefined {
  for (const name of names) {
    if (typeof value[name] === "string") return value[name];
  }
  return undefined;
}

function mapArticleResponse(value: unknown): AdminArticle | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = stringField(record, ["id"]);
  const title = stringField(record, ["title"]);
  const slug = stringField(record, ["slug"]);
  const content = stringField(record, [
    "content",
    "articleContent",
    "completeContent",
    "body",
    "contentHtml",
  ]);

  if (!id || !title || !slug || content === undefined) return null;

  return {
    id,
    title,
    slug,
    content,
    excerpt:
      stringField(record, [
        "excerpt",
        "shortDescription",
        "description",
        "summary",
      ]) ?? null,
    imageUrl:
      stringField(record, [
        "imageUrl",
        "featuredImage",
        "featuredImageUrl",
      ]) ?? null,
    mainCategory: stringField(record, [
      "mainCategory",
    ]) as AdminArticle["mainCategory"],
    category: stringField(record, [
      "category",
      "subcategory",
    ]) as AdminArticle["category"],
    language: stringField(record, [
      "language",
    ]) as AdminArticle["language"],
    isPublished:
      typeof record.isPublished === "boolean"
        ? record.isPublished
        : record.status === "published",
    createdAt: stringField(record, ["createdAt"]) ?? "",
    updatedAt: stringField(record, ["updatedAt"]) ?? "",
  };
}

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
        const loadedArticle = mapArticleResponse(body.article);
        if (!loadedArticle) {
          throw new Error("The complete article data could not be loaded.");
        }
        setArticle(loadedArticle);
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
  return <ArticleForm key={article.id} article={article} />;
}
