"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ARTICLE_CATEGORIES, LANGUAGE_NAMES, type AdminArticle } from "@/lib/article-types";

export function ArticlesManager() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [filters, setFilters] = useState({ q: "", category: "", language: "", status: "", date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      const response = await fetch(`/api/admin/articles?${params}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load articles.");
      setArticles(body.articles);
      setIsError(false);
    } catch (error) {
      setArticles([]);
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to load articles.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { const timer = setTimeout(load, 200); return () => clearTimeout(timer); }, [load]);

  async function remove(article: AdminArticle) {
    if (!confirm(`Delete “${article.title}”? This cannot be undone.`)) return;
    await mutate(article, "DELETE", "");
  }

  async function toggle(article: AdminArticle) {
    await mutate(article, "PUT", article.isPublished ? "Article unpublished." : "Article published.", { ...article, isPublished: !article.isPublished });
  }

  async function mutate(article: AdminArticle, method: "PUT" | "DELETE", successMessage: string, body?: AdminArticle) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      setIsError(!response.ok);
      setMessage(response.ok ? (successMessage || result.message) : (result.error || "Unable to update article."));
      if (response.ok) await load();
    } catch {
      setIsError(true);
      setMessage("Unable to update the article right now.");
    }
  }

  function set(key: string, value: string) { setFilters((current) => ({ ...current, [key]: value })); }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Content</p><h1 className="mt-2 text-3xl font-extrabold">Articles</h1><p className="mt-2 text-slate-600">Search, filter, publish, edit, and remove stories.</p></div><Link href="/admin/articles/new" className="rounded-xl bg-[#0B4F7A] px-5 py-3 text-sm font-bold text-white">Add article</Link></header>
    {message ? <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div> : null}
    <section className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-2 xl:grid-cols-5"><input aria-label="Search articles" placeholder="Search title…" value={filters.q} onChange={(event) => set("q", event.target.value)} className="h-11 rounded-xl border px-3" /><select value={filters.category} onChange={(event) => set("category", event.target.value)} className="h-11 rounded-xl border px-3"><option value="">All categories</option>{ARTICLE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><select value={filters.language} onChange={(event) => set("language", event.target.value)} className="h-11 rounded-xl border px-3"><option value="">All languages</option>{Object.entries(LANGUAGE_NAMES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select value={filters.status} onChange={(event) => set("status", event.target.value)} className="h-11 rounded-xl border px-3"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select><input type="date" value={filters.date} onChange={(event) => set("date", event.target.value)} className="h-11 rounded-xl border px-3" /></section>
    <section className="overflow-x-auto rounded-2xl border bg-white"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Article</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Language</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan={6} className="p-10 text-center">Loading articles…</td></tr> : articles.length ? articles.map((article) => <tr key={article.id}><td className="max-w-sm px-4 py-4"><p className="font-semibold">{article.title}</p><p className="truncate text-xs text-slate-500">/{article.slug}</p></td><td className="px-4">{article.category}</td><td className="px-4">{LANGUAGE_NAMES[article.language]}</td><td className="px-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${article.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{article.isPublished ? "published" : "draft"}</span></td><td className="px-4 text-slate-500">{new Date(article.createdAt).toLocaleString()}</td><td className="px-4"><div className="flex gap-3"><Link href={`/admin/articles/${article.id}/edit`} className="font-semibold text-cyan-700">Edit</Link>{article.isPublished ? <a href={`/articles/${article.slug}`} target="_blank" className="font-semibold">View</a> : null}<button onClick={() => toggle(article)} className="font-semibold text-orange-600">{article.isPublished ? "Unpublish" : "Publish"}</button><button onClick={() => remove(article)} className="font-semibold text-red-600">Delete</button></div></td></tr>) : <tr><td colSpan={6} className="p-10 text-center text-slate-500">No articles match these filters.</td></tr>}</tbody></table></section>
  </div>;
}
