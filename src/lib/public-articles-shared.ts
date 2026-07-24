export const TOPIC_CATEGORIES: Record<string, string[]> = {
  india: [],
  global: [],
  national: ["India"],
  international: ["Global"],
  "domestic-consumption": ["Domestic Consumption"],
  "shrimp-farming": ["Shrimp Farming"],
  "shrimp-health": ["Shrimp Health"],
  technology: ["Technology & Equipment"],
  research: ["Research & Innovations"],
  "shrimp-prices": ["Shrimp Prices"],
  "markets-industry": ["Markets & Industry"],
};

export const TOPIC_LABELS: Record<string, string> = {
  india: "India",
  global: "Global",
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

/** Translation keys for topic/category labels (language-context). */
export const TOPIC_TRANSLATION_KEYS: Record<string, string> = {
  india: "india",
  global: "global",
  national: "india",
  international: "global",
  "domestic-consumption": "domesticConsumption",
  "shrimp-farming": "shrimpFarming",
  "shrimp-health": "shrimpHealth",
  technology: "technologyEquipment",
  "technology-equipment": "technologyEquipment",
  research: "researchInnovations",
  "research-innovations": "researchInnovations",
  "shrimp-prices": "shrimpPrices",
  "markets-industry": "marketsIndustry",
  "market-industry": "marketsIndustry",
};

export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  India: "india",
  Global: "global",
  "Shrimp Farming": "shrimpFarming",
  "Shrimp Health": "shrimpHealth",
  "Technology & Equipment": "technologyEquipment",
  "Research & Innovations": "researchInnovations",
  "Shrimp Prices": "shrimpPrices",
  "Domestic Consumption": "domesticConsumption",
  "Markets & Industry": "marketsIndustry",
  National: "india",
  International: "global",
};

export function isArticleTopic(
  value: string | null | undefined,
): value is keyof typeof TOPIC_CATEGORIES {
  return Boolean(normalizeArticleTopic(value));
}

export function normalizeArticleTopic(value: string | null | undefined) {
  if (value === "national") return "india";
  if (value === "international") return "global";
  return value && value in TOPIC_CATEGORIES ? value : null;
}

export function baseSlug(slug: string) {
  return slug.replace(/-(hi|te)$/, "");
}

export function languageFromSlug(slug: string): "en" | "hi" | "te" {
  if (slug.endsWith("-te")) return "te";
  if (slug.endsWith("-hi")) return "hi";
  return "en";
}
