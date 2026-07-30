"use client";

import { useMemo, useState } from "react";
import { useLanguage, type Language } from "@/context/language-context";
import { useMarketPrices } from "@/hooks/use-market-prices";
import type { MarketPriceItem } from "@/lib/market-data/client";
import { marketTickerCopy } from "@/lib/market-data/localization";

const FALLBACK_UPDATED_AT = "2026-07-15T12:30:00.000Z";
const LAST_UPDATED_LOCALES: Record<Language, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
};

function formatLastUpdated(iso: string | null | undefined, language: Language) {
  const raw = iso && !Number.isNaN(Date.parse(iso)) ? iso : FALLBACK_UPDATED_AT;
  return new Intl.DateTimeFormat(LAST_UPDATED_LOCALES[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(raw));
}

function TickerContent({ item }: { item: MarketPriceItem }) {
  return (
    <>
      {item.type === "promotion" ? (
        <span className="rounded bg-slate-900/75 px-1.5 py-0.5 text-[8px] font-black tracking-[0.12em] text-white">
          PROMOTED
        </span>
      ) : null}
      <span className="font-semibold text-white">{item.label}</span>
      <span className="font-extrabold text-white">{item.value}</span>
      {item.description ? <span aria-hidden="true" className="text-[10px] text-white/80">ⓘ</span> : null}
    </>
  );
}

function TickerItemRow({
  item,
  interactive = true,
  onDescribe,
}: {
  item: MarketPriceItem;
  interactive?: boolean;
  onDescribe?: (item: MarketPriceItem) => void;
}) {
  const classes = "flex h-full shrink-0 items-center gap-2 border-r border-white/25 px-4 text-[11px] sm:px-5 sm:text-xs lg:px-6";
  return (
    <div className={classes} role={interactive ? "listitem" : undefined}>
      {item.description && interactive ? (
        <button
          type="button"
          onClick={() => onDescribe?.(item)}
          aria-label={`More information about ${item.label}`}
          className="flex h-full items-center gap-2 text-left"
        >
          <TickerContent item={item} />
        </button>
      ) : (
        <div className="flex h-full items-center gap-2"><TickerContent item={item} /></div>
      )}
      {item.linkUrl && interactive ? (
        <a
          href={item.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/60 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-white/15"
        >
          {item.linkLabel || "Learn More"}
        </a>
      ) : null}
    </div>
  );
}

export function MarketTicker() {
  const { language, t } = useLanguage();
  const copy = marketTickerCopy[language];
  const { data, isLoading, error, lastUpdated, refetch } = useMarketPrices();
  const [selected, setSelected] = useState<MarketPriceItem | null>(null);
  const tickerItems = useMemo(() => {
    const seen = new Set<string>();
    return data.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);
  const loadingItems = useMemo(() => Array.from({ length: 8 }), []);

  return (
    <>
      <section className="relative z-20 border-b border-[#e85a28] bg-[#ff6a3d]" aria-label={copy.tickerLabel}>
        <div className="flex items-stretch">
          <div className="flex shrink-0 items-center border-r border-white/30 bg-[#e85a28] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white sm:px-4 sm:text-[10px]">
            <span className="max-w-[9.5rem] leading-tight sm:max-w-none">
              {`${t("lastUpdated")}: ${formatLastUpdated(lastUpdated, language)}`}
            </span>
          </div>
          <div className="relative h-[30px] min-w-0 flex-1 overflow-hidden sm:h-[32px]">
            <div className="ticker-track flex h-full w-max items-center whitespace-nowrap hover:[animation-play-state:paused]" role="list" aria-label={copy.updatesLabel}>
              {isLoading && tickerItems.length === 0 && loadingItems.map((_, index) => (
                <div key={`loading-${index}`} className="flex h-full shrink-0 items-center gap-2 border-r border-white/25 px-4 text-[11px] text-white/70 sm:px-5">
                  <span className="h-2 w-2 rounded-full bg-white/50" />
                  <span className="h-2 w-16 rounded-full bg-white/35" />
                  <span className="h-2 w-10 rounded-full bg-white/35" />
                </div>
              ))}
              {tickerItems.length > 0 ? (
                <>
                  {tickerItems.map((item) => <TickerItemRow key={item.id} item={item} onDescribe={setSelected} />)}
                  <div className="flex h-full" aria-hidden="true">
                    {tickerItems.map((item) => <TickerItemRow key={`loop-${item.id}`} item={item} interactive={false} />)}
                  </div>
                </>
              ) : null}
              {!isLoading && tickerItems.length === 0 ? (
                <div className="flex h-full shrink-0 items-center gap-2 px-4 text-xs text-white">
                  <span>{copy.unavailable}</span>
                  <button type="button" onClick={() => void refetch()} className="rounded-full border border-white/50 bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white/25">
                    {copy.retry}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {error ? <div className="border-t border-white/25 px-4 py-1 text-center text-[9px] uppercase tracking-[0.18em] text-white/90">{copy.error}</div> : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="ticker-description-title" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                {selected.type === "promotion" ? <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">Promoted</p> : null}
                <h2 id="ticker-description-title" className="text-lg font-extrabold text-slate-900">{selected.label}</h2>
                <p className="mt-1 font-bold text-[#0B4F7A]">{selected.value}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close ticker details" className="rounded-full border px-3 py-1 text-sm font-bold">Close</button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{selected.description}</p>
            {selected.linkUrl ? (
              <a href={selected.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-[#0B4F7A] px-4 py-2 text-sm font-bold text-white">
                {selected.linkLabel || "Learn More"}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
