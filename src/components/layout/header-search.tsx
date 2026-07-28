"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type HeaderSearchProps = {
  className?: string;
  inputClassName?: string;
};

export function HeaderSearch({
  className = "",
  inputClassName = "",
}: HeaderSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    router.push(`/articles?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search articles"
      className={className}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
        <Search className="h-4 w-4" aria-hidden="true" />
      </span>

      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search..."
        aria-label="Search articles"
        className={`min-w-0 flex-1 truncate border-0 bg-transparent text-sm text-[#1E3A5F] outline-none placeholder:text-[#64748B] ${inputClassName}`}
      />

      <button
        type="submit"
        className="shrink-0 rounded-full bg-[#3F475A] px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-[#2E3444]"
      >
        Search
      </button>
    </form>
  );
}
