"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fallbackMarketPrices } from "@/data/fallback-market-prices";

export interface MarketPriceItem {
  symbol: string;
  label: string;
  price: number;
  currency: string;
  unit: string;
  changePercent?: number | null;
  direction: "up" | "down" | "neutral";
  sourceName: string;
  isLive: boolean;
  observedAt: string;
  updatedAt: string;
}

interface MarketPricesApiResponse {
  items: MarketPriceItem[];
  source: string;
  isFallback: boolean;
  fetchedAt: string;
}

const REFRESH_MS = 3 * 60 * 1000;
const STALE_MS = 10 * 60 * 1000;

function buildFallbackPayload(): MarketPricesApiResponse {
  return {
    items: fallbackMarketPrices.map((item) => ({
      symbol: item.symbol,
      label: item.label,
      price: item.price,
      currency: item.currency,
      unit: item.unit,
      changePercent: item.changePercent ?? null,
      direction: item.direction,
      sourceName: item.sourceName,
      isLive: item.isLive,
      observedAt: item.observedAt,
      updatedAt: item.updatedAt,
    })),
    source: "fallback",
    isFallback: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function useMarketPrices() {
  const initialPayload = useMemo(() => buildFallbackPayload(), []);
  const [data, setData] = useState<MarketPricesApiResponse>(initialPayload);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    initialPayload.fetchedAt,
  );
  const intervalRef = useRef<number | null>(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch("/api/market-prices", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load market prices");
      }

      const payload = (await response.json()) as MarketPricesApiResponse;

      if (!payload.items?.length) {
        throw new Error("Empty market price payload");
      }

      setData(payload);
      setIsFallback(Boolean(payload.isFallback));
      setLastUpdated(payload.fetchedAt);
      setError(null);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPrices();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchPrices();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    intervalRef.current = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchPrices();
      }
    }, REFRESH_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isStale = useMemo(() => {
    if (!lastUpdated) {
      return false;
    }
    const updated = Date.parse(lastUpdated);
    return Number.isFinite(updated) && Date.now() - updated > STALE_MS;
  }, [lastUpdated]);

  return {
    data: data.items,
    isLoading,
    error,
    isFallback,
    lastUpdated,
    isStale,
    refetch: fetchPrices,
  };
}
