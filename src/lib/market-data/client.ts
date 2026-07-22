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

export interface MarketPricesApiResponse {
  items: MarketPriceItem[];
  source: string;
  isFallback: boolean;
  fetchedAt: string;
}

/** Fallback Last Updated when DB ticker is empty: 15 Jul 2026, 06:00 PM IST. */
const FALLBACK_LAST_UPDATED = "2026-07-15T12:30:00.000Z";

export function buildDemoMarketPricesPayload(): MarketPricesApiResponse {
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
      isLive: false,
      observedAt: FALLBACK_LAST_UPDATED,
      updatedAt: FALLBACK_LAST_UPDATED,
    })),
    source: "demo-fallback",
    isFallback: true,
    fetchedAt: FALLBACK_LAST_UPDATED,
  };
}

function isMarketPricesApiResponse(
  payload: unknown,
): payload is MarketPricesApiResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<MarketPricesApiResponse>;

  return (
    Array.isArray(candidate.items) &&
    candidate.items.length > 0 &&
    candidate.items.every(
      (item) =>
        item &&
        typeof item.symbol === "string" &&
        typeof item.label === "string" &&
        typeof item.price === "number" &&
        Number.isFinite(item.price) &&
        typeof item.currency === "string" &&
        typeof item.unit === "string" &&
        ["up", "down", "neutral"].includes(item.direction) &&
        typeof item.sourceName === "string" &&
        typeof item.isLive === "boolean" &&
        typeof item.observedAt === "string" &&
        typeof item.updatedAt === "string",
    ) &&
    typeof candidate.source === "string" &&
    typeof candidate.isFallback === "boolean" &&
    typeof candidate.fetchedAt === "string"
  );
}

export async function fetchMarketPrices(): Promise<MarketPricesApiResponse> {
  const response = await fetch("/api/ticker", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to load market prices (${response.status})`);
  }

  const payload: unknown = await response.json();

  if (!isMarketPricesApiResponse(payload)) {
    throw new Error("The market price API returned an invalid response");
  }

  return payload;
}
