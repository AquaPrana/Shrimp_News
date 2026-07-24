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

export function hasCompleteArticleTranslation(article: LanguageRecord) {
  return Boolean(
    article.title.trim() &&
      article.excerpt?.trim() &&
      article.content.trim(),
  );
}

/**
 * One selection rule for cards, listings and detail pages:
 * selected language → English → original record.
 */
export function selectArticleByLanguage<T extends LanguageRecord>(
  versions: T[],
  language: ArticleLanguage,
) {
  return (
    versions.find(
      (article) =>
        article.language === language &&
        hasCompleteArticleTranslation(article),
    ) ||
    versions.find(
      (article) =>
        article.language === "en" &&
        hasCompleteArticleTranslation(article),
    ) ||
    versions.find((article) => article.language === language) ||
    versions.find((article) => article.language === "en") ||
    versions[0]
  );
}
