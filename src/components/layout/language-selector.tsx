"use client";

import { useEffect, useRef, useState } from "react";
import {
  useLanguage,
  type Language,
} from "@/context/language-context";

const languages: Array<{
  code: Language;
  shortLabel: string;
}> = [
  { code: "en", shortLabel: "EN" },
  { code: "te", shortLabel: "TE" },
  { code: "hi", shortLabel: "HI" },
];

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const getLanguageName = (code: Language) => {
    if (code === "en") return t("english");
    if (code === "te") return t("telugu");
    return t("hindi");
  };

  const selectLanguage = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative z-[90] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-3 text-xs font-semibold text-white transition hover:border-sky-400 hover:text-sky-300"
      >
        <span aria-hidden="true">🌐</span>
        <span>
          {languages.find((item) => item.code === language)?.shortLabel}
        </span>
        <span
          aria-hidden="true"
          className={`text-[10px] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <div
        role="listbox"
        className={`absolute right-0 top-full z-[110] mt-2 w-44 overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#0B4F7A] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
      >
        {languages.map((item) => {
          const active = item.code === language;

          return (
            <button
              key={item.code}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => selectLanguage(item.code)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-white/15 text-sky-300"
                  : "text-white hover:bg-white/10 hover:text-sky-300"
              }`}
            >
              <span>{getLanguageName(item.code)}</span>
              <span className="text-xs text-cyan-100/70">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
