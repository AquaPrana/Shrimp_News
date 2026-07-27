import type {
  ArticleLanguage,
  ArticleSubcategory,
  PublicArticle,
} from "@/lib/article-types";

type LanguageRecord = {
  language: string;
  title: string;
  excerpt: string | null;
  content: string;
};

/** Flat multilingual fields used by UI localization. */
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
  /** True when the requested language fields were missing. */
  translationMissing: boolean;
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

const TRANSLATION_UNAVAILABLE: Record<ArticleLanguage, string> = {
  en: "Translation unavailable",
  te: "అనువాదం అందుబాటులో లేదు",
  hi: "अनुवाद उपलब्ध नहीं है",
};

const AUTHOR_LABEL: Record<ArticleLanguage, string> = {
  en: "Shrimp News Editorial",
  te: "శ్రింప్ న్యూస్ సంపాదకీయం",
  hi: "श्रिम्प न्यूज़ संपादकीय",
};

function nonEmpty(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function pickText(value: string | null | undefined) {
  return nonEmpty(value) ? value!.trim() : "";
}

/**
 * Central field selector for stored multilingual article content.
 * English uses English fields only.
 * Telugu/Hindi use their own fields only — never cross-mix languages.
 * Missing translations return a controlled unavailable message (no silent English body).
 */
export function getLocalizedArticle(
  article: LocalizableArticleFields,
  language: ArticleLanguage,
): LocalizedArticleText {
  const englishTitle = pickText(article.titleEn) || pickText(article.title);
  const englishSummary =
    pickText(article.summaryEn) || pickText(article.excerpt);
  const englishContent =
    pickText(article.contentEn) || pickText(article.content);

  if (language === "en") {
    return {
      title: englishTitle,
      summary: englishSummary,
      content: englishContent,
      language: "en",
      translationMissing: !englishTitle || !englishContent,
    };
  }

  if (language === "te") {
    const title = pickText(article.titleTe);
    const summary = pickText(article.summaryTe);
    const content = pickText(article.contentTe);
    if (!title || !content) {
      return {
        title: title || TRANSLATION_UNAVAILABLE.te,
        summary: summary || TRANSLATION_UNAVAILABLE.te,
        content: content || `<p>${TRANSLATION_UNAVAILABLE.te}</p>`,
        language: "te",
        translationMissing: true,
      };
    }
    return {
      title,
      summary: summary || title,
      content,
      language: "te",
      translationMissing: false,
    };
  }

  const title = pickText(article.titleHi);
  const summary = pickText(article.summaryHi);
  const content = pickText(article.contentHi);
  if (!title || !content) {
    return {
      title: title || TRANSLATION_UNAVAILABLE.hi,
      summary: summary || TRANSLATION_UNAVAILABLE.hi,
      content: content || `<p>${TRANSLATION_UNAVAILABLE.hi}</p>`,
      language: "hi",
      translationMissing: true,
    };
  }
  return {
    title,
    summary: summary || title,
    content,
    language: "hi",
    translationMissing: false,
  };
}

/** Apply getLocalizedArticle onto a PublicArticle for display. */
export function localizePublicArticle(
  article: PublicArticle,
  language: ArticleLanguage,
): PublicArticle {
  const localized = getLocalizedArticle(article, language);
  if (localized.translationMissing && language !== "en") {
    console.warn(
      `[i18n] Translation unavailable for article ${article.id} language=${language}`,
    );
  }
  return {
    ...article,
    title: localized.title,
    excerpt: localized.summary,
    content: localized.content,
    language,
    featuredImageAlt: localized.title,
    seoTitle: localized.title,
    seoDescription: localized.summary,
    author: AUTHOR_LABEL[language],
  };
}

export function hasCompleteArticleTranslation(article: LanguageRecord) {
  return Boolean(
    article.title.trim() &&
      article.excerpt?.trim() &&
      article.content.trim(),
  );
}

export function hasStoredLanguageFields(
  article: LocalizableArticleFields,
  language: ArticleLanguage,
) {
  if (language === "en") {
    return Boolean(
      (pickText(article.titleEn) || pickText(article.title)) &&
        (pickText(article.contentEn) || pickText(article.content)),
    );
  }
  if (language === "te") {
    return Boolean(pickText(article.titleTe) && pickText(article.contentTe));
  }
  return Boolean(pickText(article.titleHi) && pickText(article.contentHi));
}

function byLanguage<T extends LanguageRecord>(
  versions: T[],
  language: ArticleLanguage,
) {
  return versions.find((article) => article.language === language);
}

/**
 * Legacy helper for separate language rows. Prefer flat titleTe/titleHi columns.
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

/** @deprecated Prefer getLocalizedArticleVersion */
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

export function getTranslationUnavailableMessage(language: ArticleLanguage) {
  return TRANSLATION_UNAVAILABLE[language];
}

export function getAuthorLabel(language: ArticleLanguage) {
  return AUTHOR_LABEL[language];
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
