"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMarketPrices, type MarketPricesApiResponse } from "@/lib/market-data/client";

const REFRESH_MS = 3 * 60 * 1000;

export function useMarketPrices() {
  const [data, setData] = useState<MarketPricesApiResponse>({
    items: [],
    source: "initial",
    isFallback: false,
    fetchedAt: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchPrices = async () => {
    try {
      const payload = await fetchMarketPrices();

      setData({
        ...payload,
        items: [...payload.items].sort((a, b) => a.displayOrder - b.displayOrder),
      });
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
    const initialFetchTimeout = window.setTimeout(() => {
      void fetchPrices();
    }, 0);

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
      window.clearTimeout(initialFetchTimeout);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data: data.items,
    isLoading,
    error,
    isFallback,
    lastUpdated,
    isStale: false,
    refetch: fetchPrices,
  };
}
