"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/context/language-context";
import { useMarketPrices } from "@/hooks/use-market-prices";
import { tickerDisplayDetail, tickerDisplayHeading, type MarketPriceItem } from "@/lib/market-data/client";
import { marketTickerCopy } from "@/lib/market-data/localization";
import { trackEvent } from "@/lib/analytics";

function formatLastUpdated(iso: string | null | undefined) {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function TickerContent({ item }: { item: MarketPriceItem }) {
  const detail = tickerDisplayDetail(item);
  const heading = tickerDisplayHeading(item.label);
  const usesMessageSeparator = item.type !== "market" && item.type !== "feed";
  return (
    <>
      {item.type === "promotion" || item.type === "coupon" ? (
        <span className="rounded bg-slate-900/75 px-1.5 py-0.5 text-[8px] font-black tracking-[0.12em] text-white">
          {item.type === "coupon" && item.couponCode ? `CODE ${item.couponCode}` : "PROMOTED"}
        </span>
      ) : null}
      <span className="ticker-brand text-white">{heading.brand}</span>
      {heading.tagline ? <><span aria-hidden="true" className="text-white/75">•</span><span className="ticker-tagline text-white">{heading.tagline}</span></> : null}
      {detail ? <>{usesMessageSeparator ? <span aria-hidden="true" className="text-white/75">•</span> : null}<span className="ticker-description text-white/95">{detail}</span></> : null}
    </>
  );
}

function TickerItemRow({ item }: { item: MarketPriceItem }) {
  const classes = "flex h-full w-max shrink-0 items-center gap-2 border-r border-white/25 px-4 text-xs sm:px-5 sm:text-sm lg:px-6";
  function openCampaign() {
    if (!item.linkUrl) return;
    trackEvent("ticker_click", { ticker_id: item.id, ticker_type: item.type, campaign_name: item.campaignName || item.label, destination_url: item.linkUrl });
    trackEvent("external_link_click", { ticker_id: item.id, campaign_name: item.campaignName || item.label, destination_url: item.linkUrl });
    if ((item.type === "promotion" || item.type === "coupon") && item.couponCode) trackEvent("coupon_click", { coupon_code: item.couponCode, campaign_name: item.campaignName || item.label });
  }
  const ctaIsInValue = Boolean(item.linkLabel && !item.description?.trim() && item.value.toLowerCase().includes(item.linkLabel.toLowerCase()));
  const content = <><TickerContent item={item} />{item.linkLabel && !ctaIsInValue ? <><span aria-hidden="true" className="text-white/75">•</span><span className="ticker-cta text-white">{item.linkLabel} →</span></> : null}</>;
  return item.linkUrl ? (
    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" onClick={openCampaign} aria-label={`Open ${item.campaignName || item.label}`} role="listitem" className={`${classes} ticker-item-link text-left transition-colors hover:bg-white/10`}>{content}</a>
  ) : (
    <div className={classes} role="listitem">{content}</div>
  );
}

export function MarketTicker() {
  const { t } = useLanguage();
  const copy = marketTickerCopy;
  const { data, isLoading, error, lastUpdated, refetch } = useMarketPrices();
  const tickerRef = useRef<HTMLElement>(null);
  const tickerItems = useMemo(() => {
    const seen = new Set<string>();
    return data.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);
  const shouldAnimate = tickerItems.length > 0;

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const updateTickerHeight = () => {
      document.documentElement.style.setProperty(
        "--ticker-height",
        `${ticker.getBoundingClientRect().height}px`,
      );
    };

    updateTickerHeight();
    const observer = new ResizeObserver(updateTickerHeight);
    observer.observe(ticker);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--ticker-height");
    };
  }, []);

  useEffect(() => {
    if (!tickerItems.length) return;
    tickerItems.forEach((item) => {
      trackEvent("ticker_impression", { ticker_id: item.id, ticker_type: item.type, campaign_name: item.campaignName || item.label, destination_url: item.linkUrl });
      if ((item.type === "promotion" || item.type === "coupon") && item.couponCode) trackEvent("coupon_view", { coupon_code: item.couponCode, campaign_name: item.campaignName || item.label });
    });
  }, [tickerItems]);

  return (
    <>
      <section ref={tickerRef} className="relative z-20 border-b border-[#e85a28] bg-[#ff6a3d]" aria-label={copy.tickerLabel}>
        <div className="flex items-stretch">
          <div className="flex shrink-0 items-center border-r border-white/30 bg-[#e85a28] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white sm:px-4 sm:text-[10px]">
            <span className="max-w-[9.5rem] leading-tight sm:max-w-none">
              {`${t("lastUpdated")}: ${formatLastUpdated(lastUpdated)}`}
            </span>
          </div>
          <div className="relative h-[30px] min-w-0 flex-1 overflow-hidden sm:h-[32px]">
            <div className={`${shouldAnimate ? "ticker-track" : ""} flex h-full w-max items-center whitespace-nowrap`} role="list" aria-label={copy.updatesLabel}>
              {isLoading && tickerItems.length === 0 ? (
                <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/25 px-4 text-[11px] text-white/70 sm:px-5">
                  <span className="h-2 w-2 rounded-full bg-white/50" />
                  <span className="h-2 w-16 rounded-full bg-white/35" />
                  <span className="h-2 w-10 rounded-full bg-white/35" />
                </div>
              ) : null}
              {tickerItems.length > 0 ? (
                <>
                  {tickerItems.map((item) => <TickerItemRow key={item.id} item={item} />)}
                  <div className="flex h-full">
                    {tickerItems.map((item) => <TickerItemRow key={`loop-${item.id}`} item={item} />)}
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
    </>
  );
}
