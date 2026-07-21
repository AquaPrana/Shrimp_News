"use client";

import { useMemo } from "react";
import { useLanguage, type Language } from "@/context/language-context";
import { useMarketPrices } from "@/hooks/use-market-prices";
import type { MarketPriceItem } from "@/lib/market-data/client";
import {
  getLocalizedMarketLabel,
  getLocalizedMarketUnit,
  marketTickerCopy,
} from "@/lib/market-data/localization";

/** Shown when the market API does not provide a usable timestamp. */
const STATIC_UPDATED_AT = "2026-07-13T10:00:00.000Z";

function formatPrice(
  value: number,
  currency: string,
  unit: string,
  language: Language,
) {
  if (unit === "MT") {
    // Volume only — never combine currency symbols with MT.
    if (value >= 100_000) {
      const lakh = Math.round((value / 100_000) * 100) / 100;
      const lakhLabel = Number.isInteger(lakh)
        ? String(lakh)
        : lakh.toFixed(2).replace(/\.?0+$/, "");
      return `${lakhLabel} lakh ${getLocalizedMarketUnit(unit, language)}`;
    }

    return `${value.toLocaleString("en-IN")} ${getLocalizedMarketUnit(unit, language)}`;
  }

  const currencySymbol =
    currency === "USD" ? "$" : currency === "INR" ? "₹" : "";

  const priceValue =
    value >= 1000
      ? value.toLocaleString("en-IN")
      : value.toFixed(value % 1 === 0 ? 0 : 1);

  if (unit === "kg") {
    return `${currencySymbol}${priceValue}/${getLocalizedMarketUnit(unit, language)}`;
  }

  return `${currencySymbol}${priceValue}`;
}

function formatChange(
  changePercent: number | null | undefined,
  direction: "up" | "down" | "neutral",
) {
  if (changePercent == null) {
    return null;
  }

  const rounded = Number(changePercent.toFixed(1));

  if (direction === "up") {
    return `▲ ${rounded}%`;
  }

  if (direction === "down") {
    return `▼ ${Math.abs(rounded)}%`;
  }

  return `${rounded}%`;
}

function formatLastUpdated(iso: string | null | undefined, language: Language) {
  const raw = iso && !Number.isNaN(Date.parse(iso)) ? iso : STATIC_UPDATED_AT;
  const date = new Date(raw);
  const locale =
    language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";

  return date.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TickerItemRow({
  item,
  language,
  copy,
  isStale,
}: {
  item: MarketPriceItem;
  language: Language;
  copy: (typeof marketTickerCopy)[Language];
  isStale: boolean;
}) {
  const changeLabel = formatChange(item.changePercent, item.direction);

  return (
    <div
      className="flex h-full shrink-0 items-center gap-2 border-r border-white/25 px-4 text-[11px] sm:px-5 sm:text-xs lg:px-6"
      role="listitem"
    >
      <span className="ticker-localized-text font-semibold text-white">
        {getLocalizedMarketLabel(item.symbol, item.label, language)}
      </span>

      <span className="ticker-localized-text font-extrabold text-white">
        {formatPrice(item.price, item.currency, item.unit, language)}
      </span>

      <span
        className="font-semibold text-[#0f172a]"
        aria-label={`${copy.directions[item.direction]} ${copy.change}`}
      >
        {changeLabel ?? "—"}
      </span>

      {item.isLive && (
        <span className="rounded-full border border-white/40 bg-white/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white">
          {copy.live}
        </span>
      )}

      {isStale && (
        <span className="rounded-full border border-white/35 bg-black/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white">
          {copy.delayed}
        </span>
      )}
    </div>
  );
}

export function MarketTicker() {
  const { language } = useLanguage();
  const copy = marketTickerCopy[language];
  const { data, isLoading, error, isStale, lastUpdated, refetch } =
    useMarketPrices();

  // One unique logical set — never flatten a duplicated array into the data.
  const tickerItems = useMemo(() => {
    const seen = new Set<string>();
    return data.filter((item) => {
      if (seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    });
  }, [data]);

  const loadingItems = useMemo(() => Array.from({ length: 8 }), []);

  const updatedLabel = formatLastUpdated(
    lastUpdated ||
      tickerItems[0]?.updatedAt ||
      tickerItems[0]?.observedAt,
    language,
  );

  return (
    <section
      className="relative z-20 border-b border-[#e85a28] bg-[#ff6a3d]"
      aria-label={copy.tickerLabel}
    >
      <div className="flex items-stretch">
        <div className="flex shrink-0 items-center border-r border-white/30 bg-[#e85a28] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white sm:px-4 sm:text-[10px]">
          <span className="max-w-[9.5rem] leading-tight sm:max-w-none">
            Last updated: {updatedLabel}
          </span>
        </div>

        <div className="relative h-[30px] min-w-0 flex-1 overflow-hidden sm:h-[32px]">
          <div
            className="ticker-track flex h-full w-max items-center whitespace-nowrap hover:[animation-play-state:paused]"
            role="list"
            aria-label={copy.updatesLabel}
          >
            {isLoading &&
              tickerItems.length === 0 &&
              loadingItems.map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="flex h-full shrink-0 items-center gap-2 border-r border-white/25 px-4 text-[11px] text-white/70 sm:px-5"
                >
                  <span className="h-2 w-2 rounded-full bg-white/50" />
                  <span className="h-2 w-16 rounded-full bg-white/35" />
                  <span className="h-2 w-10 rounded-full bg-white/35" />
                </div>
              ))}

            {tickerItems.length > 0 ? (
              <>
                {/* Primary unique set — one of each market item. */}
                {tickerItems.map((item) => (
                  <TickerItemRow
                    key={item.symbol}
                    item={item}
                    language={language}
                    copy={copy}
                    isStale={isStale}
                  />
                ))}
                {/*
                  Seamless CSS loop clone only (translateX -50%).
                  Hidden from assistive tech so prices are announced once.
                */}
                <div className="flex h-full" aria-hidden="true">
                  {tickerItems.map((item) => (
                    <TickerItemRow
                      key={`loop-${item.symbol}`}
                      item={item}
                      language={language}
                      copy={copy}
                      isStale={isStale}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {!isLoading && tickerItems.length === 0 && (
              <div className="flex h-full shrink-0 items-center gap-2 px-4 text-xs text-white">
                <span>{copy.unavailable}</span>

                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-full border border-white/50 bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-white/25"
                >
                  {copy.retry}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="border-t border-white/25 px-4 py-1 text-center text-[9px] uppercase tracking-[0.18em] text-white/90">
          {copy.error}
        </div>
      )}
    </section>
  );
}
