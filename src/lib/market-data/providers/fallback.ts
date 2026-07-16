import { MarketPriceInput, MarketPriceProvider } from "./types";
import { fallbackMarketPrices } from "@/data/fallback-market-prices";

export class FallbackProvider implements MarketPriceProvider {
  async fetchPrices(): Promise<MarketPriceInput[]> {
    return fallbackMarketPrices.map((item) => ({
      ...item,
      observedAt: item.observedAt,
      updatedAt: item.updatedAt,
    }));
  }
}
