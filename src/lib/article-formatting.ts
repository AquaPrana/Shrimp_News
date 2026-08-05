export function getCategoryLabel(category: string, _language?: "en") {
  void _language;
  return category;
}

export function formatReadTime(minutes: number, _language?: "en") {
  void _language;
  return `${Math.max(1, Math.ceil(minutes))} min read`;
}

export function getArticleLabel(_language?: "en") {
  void _language;
  return "ARTICLE";
}

export function getReadArticleLabel(_language?: "en") {
  void _language;
  return "Read Article";
}

export function getAuthorLabel(_language?: "en") {
  void _language;
  return "Shrimp News Editorial";
}

export function formatLocalizedDate(
  value: string | Date,
  _language?: "en",
  options?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}
