export const TOPIC_CATEGORIES: Record<string, string[]> = {
  national: ["National"],
  international: ["International"],
  "domestic-consumption": ["Domestic Consumption"],
  "shrimp-farming": ["Shrimp Farming"],
  "shrimp-health": ["Shrimp Health"],
  technology: ["Technology & Equipment"],
  research: ["Research & Innovations"],
  "shrimp-prices": ["Shrimp Prices"],
  "markets-industry": ["Markets & Industry"],
};

export const TOPIC_LABELS: Record<string, string> = {
  national: "India",
  international: "Global",
  "domestic-consumption": "Domestic Consumption",
  "shrimp-farming": "Shrimp Farming",
  "shrimp-health": "Shrimp Health",
  technology: "Technology",
  research: "Research",
  "shrimp-prices": "Shrimp Prices",
  "markets-industry": "Markets & Industry",
};

export function isArticleTopic(
  value: string | null | undefined,
): value is keyof typeof TOPIC_CATEGORIES {
  return Boolean(value && value in TOPIC_CATEGORIES);
}
