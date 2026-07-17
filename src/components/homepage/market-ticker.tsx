"use client";

import { useMemo } from "react";
import { useLanguage, type Language } from "@/context/language-context";
import { useMarketPrices } from "@/hooks/use-market-prices";
import {
  getLocalizedMarketLabel,
  getLocalizedMarketUnit,
  marketTickerCopy,
} from "@/lib/market-data/localization";

function formatPrice(
  value: number,
  currency: string,
  unit: string,
  language: Language,
) {
  const currencySymbol =
    currency === "USD" ? "$" : currency === "INR" ? "₹" : "";

  const priceValue =
    value >= 1000
      ? value.toLocaleString("en-IN")
      : value.toFixed(value % 1 === 0 ? 0 : 1);

  if (unit === "kg") {
    return `${currencySymbol}${priceValue}/${getLocalizedMarketUnit(unit, language)}`;
  }

  if (unit === "MT") {
    return `${currencySymbol}${priceValue} ${getLocalizedMarketUnit(unit, language)}`;
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

export function MarketTicker() {
  const { language } = useLanguage();
  const copy = marketTickerCopy[language];
  const { data, isLoading, error, isStale, refetch } =
    useMarketPrices();

  const tickerItems = useMemo(
    () => (data.length === 0 ? [] : data),
    [data],
  );

  const duplicatedItems = useMemo(
    () =>
      tickerItems.length === 0
        ? []
        : [...tickerItems, ...tickerItems],
    [tickerItems],
  );

  const loadingItems = useMemo(
    () => Array.from({ length: 7 }),
    [],
  );

  return (
    <section
      className="relative z-20 border-b border-[#e85a28] bg-[#ff6a3d]"
      aria-label={copy.tickerLabel}
    >
      <div className="relative h-[30px] overflow-hidden sm:h-[32px]">
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

          {tickerItems.length > 0 &&
            duplicatedItems.map((item, index) => {
              const changeLabel = formatChange(
                item.changePercent,
                item.direction,
              );

              return (
                <div
                  key={`${item.symbol}-${index}`}
                  className="flex h-full shrink-0 items-center gap-2 border-r border-white/25 px-4 text-[11px] sm:px-5 sm:text-xs lg:px-6"
                  role="listitem"
                >
                  <span className="ticker-localized-text font-semibold text-white">
                    {getLocalizedMarketLabel(
                      item.symbol,
                      item.label,
                      language,
                    )}
                  </span>

                  <span className="ticker-localized-text font-extrabold text-white">
                    {formatPrice(
                      item.price,
                      item.currency,
                      item.unit,
                      language,
                    )}
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
            })}

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

      {error && (
        <div className="border-t border-white/25 px-4 py-1 text-center text-[9px] uppercase tracking-[0.18em] text-white/90">
          {copy.error}
        </div>
      )}
    </section>
  );
}
