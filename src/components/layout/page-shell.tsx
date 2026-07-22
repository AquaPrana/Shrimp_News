"use client";

import type { ReactNode } from "react";
import { useLanguage, type TranslationKey } from "@/context/language-context";

/** Light content panel for navigation/category pages (not home blue cards). */
export const PAGE_CONTENT_PANEL_CLASS =
  "rounded-2xl border border-slate-200 bg-[#F7FBFF] p-5 text-sm leading-7 text-slate-700 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:rounded-[28px] sm:p-8 sm:text-base sm:leading-8";

type PageShellProps = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  eyebrowKey?: TranslationKey;
  /** Single body blob (paragraphs separated by blank lines). Prefer bodyKeys for new pages. */
  bodyKey?: TranslationKey;
  /** Ordered translation keys — one paragraph/block per key for multilingual pages. */
  bodyKeys?: readonly TranslationKey[];
  hideTitleAndDescription?: boolean;
  children?: ReactNode;
};

export function PageShell({
  titleKey,
  descriptionKey,
  eyebrowKey,
  bodyKey,
  bodyKeys,
  hideTitleAndDescription = false,
  children,
}: PageShellProps) {
  const { t } = useLanguage();

  const resolvedParagraphs =
    bodyKeys?.map((key) => t(key).trim()).filter(Boolean) ??
    (bodyKey
      ? t(bodyKey)
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
      : []);

  return (
    <section className="relative overflow-x-hidden bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-orange-100/30 blur-[100px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
        <div className="max-w-3xl space-y-3 sm:space-y-4">
          {eyebrowKey ? (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500 sm:text-sm">
              {t(eyebrowKey)}
            </p>
          ) : null}
          {!hideTitleAndDescription ? (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
                {t(titleKey)}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
                {t(descriptionKey)}
              </p>
            </>
          ) : null}
        </div>

        {children ??
          (resolvedParagraphs.length > 0 ? (
            <div className={PAGE_CONTENT_PANEL_CLASS}>
              {resolvedParagraphs.map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null)}
      </div>
    </section>
  );
}
