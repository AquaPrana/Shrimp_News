import { MarketPriceInput, MarketPriceProvider, MarketPriceProviderError } from "./types";

export class AquaBrahmaProvider implements MarketPriceProvider {
  async fetchPrices(): Promise<MarketPriceInput[]> {
    const apiUrl = process.env.AQUABRAHMA_API_URL;
    const apiKey = process.env.AQUABRAHMA_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new MarketPriceProviderError("AquaBrahma provider is unavailable because AQUABRAHMA_API_URL or AQUABRAHMA_API_KEY is missing.");
    }

    // TODO: Replace this placeholder with the approved AquaBrahma API request.
    // Example flow:
    // const response = await fetch(apiUrl, {
    //   headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    //   cache: "no-store"
    // });
    // const payload = await response.json();
    // return normalizeAquaBrahmaPayload(payload);

    throw new MarketPriceProviderError("AquaBrahma adapter is not configured for live API access yet.");
  }
}
