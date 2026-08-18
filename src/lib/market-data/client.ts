import { fallbackMarketPrices } from "@/data/fallback-market-prices";

export const TICKER_ITEM_TYPES = [
  "market",
  "feed",
  "external_link",
  "product_launch",
  "promotion",
  "coupon",
  "announcement",
  "custom_message",
] as const;
export type TickerItemType = (typeof TICKER_ITEM_TYPES)[number];

const LEGACY_TICKER_TYPE_ALIASES: Record<string, TickerItemType> = {
  update: "external_link",
  website_link: "external_link",
  shrimp_market_price: "market",
  feed_price: "feed",
  coupon_code: "coupon",
};

export function normalizeTickerItemType(value: string): TickerItemType {
  const normalized = value.trim().toLowerCase();
  if (TICKER_ITEM_TYPES.includes(normalized as TickerItemType)) {
    return normalized as TickerItemType;
  }
  return LEGACY_TICKER_TYPE_ALIASES[normalized] || "custom_message";
}

export interface MarketPriceItem {
  id: string;
  label: string;
  value: string;
  description: string | null;
  type: TickerItemType;
  linkUrl: string | null;
  linkLabel: string | null;
  imageUrl: string | null;
  couponCode: string | null;
  campaignName: string | null;
  displayOrder: number;
  updatedAt: string;
}

export interface MarketPricesApiResponse {
  items: MarketPriceItem[];
  source: string;
  isFallback: boolean;
  fetchedAt: string;
}

export function tickerDisplayDetail(item: Pick<MarketPriceItem, "type" | "label" | "value" | "description">) {
  let detail: string;
  switch (item.type) {
    case "market":
    case "feed":
      detail = item.value;
      break;
    case "product_launch":
    case "promotion":
    case "coupon":
    case "announcement":
    case "external_link":
    case "custom_message":
      detail = item.description?.trim() || item.value;
      break;
  }
  return detail.trim() === item.label.trim() ? "" : detail;
}

export function tickerDisplayHeading(label: string) {
  const separated = label.split(/\s*[•|—]\s*/, 2);
  if (separated.length === 2 && separated[0] && separated[1]) {
    return { brand: separated[0], tagline: separated[1] };
  }

  const telAqua = label.match(/^(Tel-Aqua)\s+(.+)$/i);
  if (telAqua) {
    return { brand: telAqua[1], tagline: telAqua[2] };
  }

  return { brand: label, tagline: "" };
}

const FALLBACK_LAST_UPDATED = "2026-07-15T12:30:00.000Z";

export function fallbackValue(item: (typeof fallbackMarketPrices)[number]) {
  let value: string;
  if (item.unit === "MT") {
    value = `${Number((item.price / 100_000).toFixed(2))} lakh MT`;
  } else if (item.unit === "kg") {
    const currency = item.currency === "USD" ? "$" : item.currency === "INR" ? "₹" : "";
    value = `${currency}${item.price}/kg`;
  } else {
    const currency = item.currency === "USD" ? "$" : item.currency === "INR" ? "₹" : "";
    value = `${currency}${item.price}`;
  }
  if (item.changePercent != null) {
    const marker = item.direction === "up" ? "▲" : item.direction === "down" ? "▼" : "";
    value += ` ${marker ? `${marker} ` : ""}${Math.abs(item.changePercent)}%`;
  }
  return value;
}

export function buildDemoMarketPricesPayload(): MarketPricesApiResponse {
  return {
    items: fallbackMarketPrices.map((item, displayOrder) => ({
      id: `fallback-${item.symbol}`,
      label: item.label,
      value: fallbackValue(item),
      description: null,
      type: "market",
      linkUrl: null,
      linkLabel: null,
      imageUrl: null,
      couponCode: null,
      campaignName: item.label,
      displayOrder,
      updatedAt: FALLBACK_LAST_UPDATED,
    })),
    source: "demo-fallback",
    isFallback: true,
    fetchedAt: FALLBACK_LAST_UPDATED,
  };
}

function isMarketPricesApiResponse(payload: unknown): payload is MarketPricesApiResponse {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<MarketPricesApiResponse>;
  return (
    Array.isArray(candidate.items) &&
    candidate.items.every((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      typeof item.value === "string" &&
      (item.description === null || typeof item.description === "string") &&
      TICKER_ITEM_TYPES.includes(item.type) &&
      (item.linkUrl === null || typeof item.linkUrl === "string") &&
      (item.linkLabel === null || typeof item.linkLabel === "string") &&
      (item.imageUrl === null || typeof item.imageUrl === "string") &&
      typeof item.displayOrder === "number" &&
      typeof item.updatedAt === "string"
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
  if (!response.ok) throw new Error(`Unable to load ticker items (${response.status})`);
  const payload: unknown = await response.json();
  if (!isMarketPricesApiResponse(payload)) {
    throw new Error("The ticker API returned an invalid response");
  }
  return payload;
}
