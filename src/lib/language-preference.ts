export type Language = "en" | "te" | "hi";

/** Cookie + localStorage key used as the language preference source of truth. */
export const LANGUAGE_COOKIE_KEY = "shrimp-news-language";
export const LANGUAGE_STORAGE_KEY = "shrimp-news-language";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "te" || value === "hi";
}

export function parseLanguage(
  value: string | null | undefined,
): Language | null {
  if (!value) return null;
  const normalized = decodeURIComponent(value).trim().toLowerCase();
  return isLanguage(normalized) ? normalized : null;
}
