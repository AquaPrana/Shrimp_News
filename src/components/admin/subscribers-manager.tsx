"use client";

/* eslint-disable @next/next/no-html-link-for-pages */
import { useCallback, useEffect, useState } from "react";
import type { AdminSubscriber } from "@/lib/article-types";

export function SubscribersManager() {
  const [items, setItems] = useState<AdminSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const response = await fetch(`/api/admin/subscribers?${params}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load subscribers.");
      setItems(body.subscribers);
    } catch (value) {
      setItems([]);
      setError(value instanceof Error ? value.message : "Unable to load subscribers.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { const timer = setTimeout(load, 200); return () => clearTimeout(timer); }, [load]);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Audience</p><h1 className="mt-2 text-3xl font-extrabold">Subscribers</h1><p className="mt-2 text-slate-600">{items.length} subscriber{items.length === 1 ? "" : "s"} match the filter.</p></div><a href="/api/admin/subscribers/export" className="rounded-xl bg-[#0B4F7A] px-5 py-3 text-sm font-bold text-white">Export CSV</a></header>
    {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    <section className="rounded-2xl border bg-white p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email…" aria-label="Search subscribers" className="h-11 w-full rounded-xl border px-3 md:max-w-md" /></section>
    <section className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Subscriber</th><th className="px-4 py-3">Subscribed</th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan={2} className="p-10 text-center">Loading subscribers…</td></tr> : items.length ? items.map((subscriber) => <tr key={subscriber.id}><td className="px-4 py-4 font-semibold">{subscriber.email}</td><td className="px-4 text-slate-500">{new Date(subscriber.createdAt).toLocaleString()}</td></tr>) : <tr><td colSpan={2} className="p-10 text-center text-slate-500">No subscribers match this filter.</td></tr>}</tbody></table></section>
  </div>;
}
