import type { Language } from "@/context/language-context";
import { formatLocalizedDate } from "@/lib/article-localization";
import type { ArticleLanguage } from "@/lib/article-types";

export function formatArticleDate(
  value: string | Date,
  language: Language = "en",
  options?: Intl.DateTimeFormatOptions,
) {
  return formatLocalizedDate(value, language as ArticleLanguage, options);
}
