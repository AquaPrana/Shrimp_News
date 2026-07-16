import { z } from "zod";

export const MarketPriceDirectionSchema = z.enum(["up", "down", "neutral"]);

export const MarketPriceInputSchema = z.object({
  symbol: z.string().trim().min(1, "Symbol is required"),
  label: z.string().trim().min(1, "Label is required"),
  category: z.string().trim().min(1, "Category is required"),
  species: z.string().trim().nullable().optional(),
  countSize: z.string().trim().nullable().optional(),
  market: z.string().trim().nullable().optional(),
  currency: z.string().trim().default("INR"),
  unit: z.string().trim().default("kg"),
  price: z.number().nonnegative("Price must be non-negative"),
  previousPrice: z.number().nonnegative().nullable().optional(),
  changeValue: z.number().nullable().optional(),
  changePercent: z.number().nullable().optional(),
  direction: MarketPriceDirectionSchema.default("neutral"),
  sourceName: z.string().trim().min(1, "Source name is required"),
  sourceUrl: z.string().url().nullable().optional(),
  isLive: z.boolean().default(false),
  isActive: z.boolean().default(true),
  observedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const MarketPriceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.string().trim().min(1),
  label: z.string().trim().min(1),
  category: z.string().trim().min(1),
  species: z.string().trim().nullable().optional(),
  count_size: z.string().trim().nullable().optional(),
  market: z.string().trim().nullable().optional(),
  currency: z.string().trim().default("INR"),
  unit: z.string().trim().default("kg"),
  price: z.number().nonnegative(),
  previous_price: z.number().nonnegative().nullable().optional(),
  change_value: z.number().nullable().optional(),
  change_percent: z.number().nullable().optional(),
  direction: MarketPriceDirectionSchema.default("neutral"),
  source_name: z.string().trim().min(1),
  source_url: z.string().url().nullable().optional(),
  is_live: z.boolean().default(false),
  is_active: z.boolean().default(true),
  observed_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_at: z.string().datetime().optional(),
  display_order: z.number().int().nonnegative().nullable().optional(),
});

export interface MarketPriceProvider {
  fetchPrices(): Promise<MarketPriceInput[]>;
}

export interface MarketPriceInput {
  symbol: string;
  label: string;
  category: string;
  species?: string | null;
  countSize?: string | null;
  market?: string | null;
  currency: string;
  unit: string;
  price: number;
  previousPrice?: number | null;
  changeValue?: number | null;
  changePercent?: number | null;
  direction: "up" | "down" | "neutral";
  sourceName: string;
  sourceUrl?: string | null;
  isLive: boolean;
  isActive: boolean;
  observedAt: string;
  updatedAt: string;
}

export class MarketPriceProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "MarketPriceProviderError";
  }
}
