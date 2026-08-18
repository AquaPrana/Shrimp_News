"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { normalizeAdminSearchQuery, type AdminSearchResult } from "@/lib/admin-search";

const SEARCH_DEBOUNCE_MS = 300;

export function AdminSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const timerRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const resetResults = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    requestIdRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    setResults([]);
    setLoading(false);
    setError("");
    setSearchedQuery("");
  }, []);

  const runSearch = useCallback(async (rawQuery: string) => {
    const normalized = normalizeAdminSearchQuery(rawQuery);
    if (!normalized) {
      resetResults();
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(normalized)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const body = await response.json() as {
        success?: boolean;
        results?: AdminSearchResult[];
        message?: string;
      };
      if (!response.ok || body.success !== true || !Array.isArray(body.results)) {
        throw new Error(body.message || "Unable to search the CMS.");
      }
      if (requestId !== requestIdRef.current) return;
      setResults(body.results);
      setSearchedQuery(normalized);
    } catch (searchError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setResults([]);
      setSearchedQuery(normalized);
      setError(searchError instanceof Error ? searchError.message : "Unable to search the CMS.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [resetResults]);

  useEffect(() => {
    const normalized = normalizeAdminSearchQuery(query);
    if (!normalized) return;
    timerRef.current = window.setTimeout(() => void runSearch(query), SEARCH_DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => () => requestRef.current?.abort(), []);

  function changeQuery(value: string) {
    setQuery(value);
    setSearchedQuery("");
    if (!normalizeAdminSearchQuery(value)) resetResults();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void runSearch(query);
  }

  function clear() {
    setQuery("");
    resetResults();
  }

  const normalizedQuery = normalizeAdminSearchQuery(query);
  const showPanel = Boolean(normalizedQuery);
  const noResults = !loading && !error && searchedQuery === normalizedQuery && results.length === 0;

  return (
    <div className="relative">
      <form onSubmit={submit} role="search" className="relative">
        <button type="submit" aria-label="Search admin dashboard" className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-[#0B4F7A]">
          <Search size={16} />
        </button>
        <input
          aria-label="Search admin dashboard"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          placeholder="Search CMS…"
          autoComplete="off"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
        />
        {query ? <button type="button" onClick={clear} aria-label="Clear admin search" className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"><X size={15} /></button> : null}
      </form>

      {showPanel ? (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,70vh)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15" role="region" aria-label="Admin search results">
          {loading ? <p className="px-3 py-6 text-center text-sm text-slate-500">Searching…</p> : null}
          {error ? <p role="alert" className="px-3 py-6 text-center text-sm text-red-600">{error}</p> : null}
          {noResults ? <p className="px-3 py-6 text-center text-sm text-slate-500">No results found</p> : null}
          {!loading && !error ? results.map((result) => (
            <Link key={`${result.type}-${result.id}`} href={result.href} onClick={clear} className="block rounded-xl px-3 py-2.5 transition hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none">
              <span className="block truncate text-sm font-bold text-slate-800">{result.title}</span>
              <span className="mt-0.5 block truncate text-xs capitalize text-slate-500">{result.subtitle}</span>
            </Link>
          )) : null}
        </div>
      ) : null}
    </div>
  );
}
