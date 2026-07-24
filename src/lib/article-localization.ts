import type {
  ArticleLanguage,
  ArticleSubcategory,
} from "@/lib/article-types";

type LanguageRecord = {
  language: string;
  title: string;
  excerpt: string | null;
  content: string;
};

/** Flat or versioned article fields used by UI localization. */
export type LocalizableArticleFields = {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  titleEn?: string | null;
  summaryEn?: string | null;
  contentEn?: string | null;
  titleTe?: string | null;
  summaryTe?: string | null;
  contentTe?: string | null;
  titleHi?: string | null;
  summaryHi?: string | null;
  contentHi?: string | null;
};

export type LocalizedArticleText = {
  title: string;
  summary: string;
  content: string;
  language: ArticleLanguage;
  usedFallback: boolean;
};

const CATEGORY_LABELS: Record<
  ArticleSubcategory,
  Record<ArticleLanguage, string>
> = {
  "Shrimp Farming": {
    en: "Shrimp Farming",
    te: "రొయ్యల పెంపకం",
    hi: "झींगा पालन",
  },
  "Shrimp Health": {
    en: "Shrimp Health",
    te: "రొయ్యల ఆరోగ్యం",
    hi: "झींगा स्वास्थ्य",
  },
  "Technology & Equipment": {
    en: "Technology & Equipment",
    te: "సాంకేతికత & పరికరాలు",
    hi: "प्रौद्योगिकी एवं उपकरण",
  },
  "Research & Innovations": {
    en: "Research & Innovations",
    te: "పరిశోధన & ఆవిష్కరణలు",
    hi: "अनुसंधान एवं नवाचार",
  },
  "Shrimp Prices": {
    en: "Shrimp Prices",
    te: "రొయ్యల ధరలు",
    hi: "झींगा कीमतें",
  },
  "Domestic Consumption": {
    en: "Domestic Consumption",
    te: "దేశీయ వినియోగం",
    hi: "घरेलू खपत",
  },
  "Markets & Industry": {
    en: "Markets & Industry",
    te: "మార్కెట్లు & పరిశ్రమ",
    hi: "बाज़ार एवं उद्योग",
  },
};

const ARTICLE_WORD: Record<ArticleLanguage, string> = {
  en: "ARTICLE",
  te: "వ్యాసం",
  hi: "लेख",
};

const READ_ARTICLE: Record<ArticleLanguage, string> = {
  en: "Read Article",
  te: "వ్యాసం చదవండి",
  hi: "लेख पढ़ें",
};

function nonEmpty(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function pickText(
  primary: string | null | undefined,
  fallback: string | null | undefined,
) {
  if (nonEmpty(primary)) return primary!.trim();
  if (nonEmpty(fallback)) return fallback!.trim();
  return "";
}

/**
 * Central field selector for article text.
 * English never falls back to te/hi. te/hi only fall back to English.
 */
export function getLocalizedArticle(
  article: LocalizableArticleFields,
  language: ArticleLanguage,
): LocalizedArticleText {
  const englishTitle = pickText(article.titleEn, article.title);
  const englishSummary = pickText(article.summaryEn, article.excerpt);
  const englishContent = pickText(article.contentEn, article.content);

  if (language === "en") {
    return {
      title: englishTitle,
      summary: englishSummary,
      content: englishContent,
      language: "en",
      usedFallback: false,
    };
  }

  if (language === "te") {
    const title = pickText(article.titleTe, englishTitle);
    const summary = pickText(article.summaryTe, englishSummary);
    const content = pickText(article.contentTe, englishContent);
    return {
      title,
      summary,
      content,
      language: nonEmpty(article.titleTe) ? "te" : "en",
      usedFallback: !nonEmpty(article.titleTe),
    };
  }

  const title = pickText(article.titleHi, englishTitle);
  const summary = pickText(article.summaryHi, englishSummary);
  const content = pickText(article.contentHi, englishContent);
  return {
    title,
    summary,
    content,
    language: nonEmpty(article.titleHi) ? "hi" : "en",
    usedFallback: !nonEmpty(article.titleHi),
  };
}

export function hasCompleteArticleTranslation(article: LanguageRecord) {
  return Boolean(
    article.title.trim() &&
      article.excerpt?.trim() &&
      article.content.trim(),
  );
}

function byLanguage<T extends LanguageRecord>(
  versions: T[],
  language: ArticleLanguage,
) {
  return versions.find((article) => article.language === language);
}

/**
 * Pick a language row from translation-group versions.
 * Never returns te for English, never returns hi for Telugu, etc.
 * Temporary fallback: missing te/hi → English only.
 */
export function getLocalizedArticleVersion<T extends LanguageRecord>(
  versions: T[],
  language: ArticleLanguage,
): T | undefined {
  const english =
    byLanguage(versions, "en") ||
    versions.find((article) => article.language === "en");

  if (language === "en") {
    return (
      versions.find(
        (article) =>
          article.language === "en" && hasCompleteArticleTranslation(article),
      ) || english
    );
  }

  const preferred = byLanguage(versions, language);
  if (preferred && hasCompleteArticleTranslation(preferred)) {
    return preferred;
  }
  if (preferred && nonEmpty(preferred.title)) {
    return preferred;
  }

  return (
    versions.find(
      (article) =>
        article.language === "en" && hasCompleteArticleTranslation(article),
    ) || english
  );
}

/** @deprecated Prefer getLocalizedArticleVersion — kept for older imports. */
export function selectArticleByLanguage<T extends LanguageRecord>(
  versions: T[],
  language: ArticleLanguage,
) {
  return getLocalizedArticleVersion(versions, language);
}

export function getCategoryLabel(
  categoryKey: string,
  language: ArticleLanguage,
) {
  return (
    CATEGORY_LABELS[categoryKey as ArticleSubcategory]?.[language] ||
    CATEGORY_LABELS[categoryKey as ArticleSubcategory]?.en ||
    categoryKey
  );
}

export function formatReadTime(
  minutes: number,
  language: ArticleLanguage,
) {
  const safeMinutes = Math.max(1, Math.ceil(minutes));
  if (language === "te") {
    return `${safeMinutes} ${
      safeMinutes === 1 ? "నిమిషం" : "నిమిషాలు"
    } చదవడానికి`;
  }
  if (language === "hi") {
    return `${safeMinutes} मिनट पढ़ने का समय`;
  }
  return `${safeMinutes} min read`;
}

export function getArticleLabel(language: ArticleLanguage) {
  return ARTICLE_WORD[language];
}

export function getReadArticleLabel(language: ArticleLanguage) {
  return READ_ARTICLE[language];
}

const DATE_LOCALE: Record<ArticleLanguage, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
};

export function formatLocalizedDate(
  value: string | Date,
  language: ArticleLanguage,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(DATE_LOCALE[language] || "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}
