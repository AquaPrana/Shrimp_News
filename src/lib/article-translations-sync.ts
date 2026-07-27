import "server-only";

import type { Article } from "@prisma/client";
import {
  translateArticleFields,
  type TranslatedArticleFields,
} from "@/lib/article-translation";
import { baseSlug } from "@/lib/public-articles-shared";
import { logDatabaseError, prisma } from "@/lib/prisma";
import type { PrismaArticleInput } from "@/lib/validation";

const TRANSLATION_LANGUAGES = ["te", "hi"] as const;
type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number];

export type TranslationStatusValue =
  | "available"
  | "pending"
  | "failed"
  | "missing";

export type TranslationSyncResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      failures: TranslationLanguage[];
    };

const LANGUAGE_NAMES: Record<TranslationLanguage, string> = {
  te: "Telugu",
  hi: "Hindi",
};

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function translationDelayMs() {
  return Math.max(
    250,
    Number(process.env.GROQ_TRANSLATION_LANGUAGE_DELAY_MS || 1500),
  );
}

function nonEmpty(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function detectChangedFields(english: Article, input: PrismaArticleInput) {
  const currentTitle = english.titleEn?.trim() || english.title.trim();
  const currentExcerpt =
    english.summaryEn?.trim() || (english.excerpt || "").trim();
  const currentContent = english.contentEn?.trim() || english.content.trim();
  return {
    title: currentTitle !== input.title.trim(),
    excerpt: currentExcerpt !== (input.excerpt || "").trim(),
    content: currentContent !== input.content.trim(),
  };
}

async function translateWithRetries(
  source: {
    title: string;
    excerpt: string | null;
    content: string;
  },
  language: TranslationLanguage,
) {
  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await translateArticleFields(source, LANGUAGE_NAMES[language]);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[article-translations-sync] ${language} attempt ${attempt}/${maxAttempts} failed:`,
        message,
      );
      if (attempt === maxAttempts) break;
      const retryMatch = message.match(/try again in ([\d.]+)s/i);
      const retryMs = retryMatch
        ? Math.ceil(Number(retryMatch[1]) * 1000) + 500
        : attempt * 2000;
      await wait(Math.max(translationDelayMs(), retryMs));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to translate article to ${LANGUAGE_NAMES[language]}.`);
}

export async function getArticleTranslationStatus(article: Article) {
  const statusFor = (language: TranslationLanguage): TranslationStatusValue => {
    if (language === "te") {
      if (nonEmpty(article.titleTe) && nonEmpty(article.contentTe)) {
        return "available";
      }
      if (nonEmpty(article.titleTe) || nonEmpty(article.contentTe)) {
        return "pending";
      }
      return "missing";
    }
    if (nonEmpty(article.titleHi) && nonEmpty(article.contentHi)) {
      return "available";
    }
    if (nonEmpty(article.titleHi) || nonEmpty(article.contentHi)) {
      return "pending";
    }
    return "missing";
  };

  return {
    en: "available" as const,
    te: statusFor("te"),
    hi: statusFor("hi"),
  };
}

/**
 * Save English fields, generate Telugu + Hindi into the same article row,
 * and only publish when all required translations are present.
 */
export async function syncArticleTranslations(
  englishArticleId: string,
  input: PrismaArticleInput,
  options: {
    languages?: TranslationLanguage[];
    forceFields?: boolean;
  } = {},
): Promise<TranslationSyncResult> {
  if (input.language !== "en") return { ok: true };

  const english = await prisma.article.findUnique({
    where: { id: englishArticleId },
  });
  if (!english) {
    return {
      ok: false,
      error: "The English source article could not be found.",
      failures: ["te", "hi"],
    };
  }

  const groupId = english.translationGroupId || crypto.randomUUID();
  const normalizedSlug = baseSlug(input.slug);
  const wantsPublish = Boolean(input.isPublished);
  const changed = options.forceFields
    ? { title: true, excerpt: true, content: true }
    : detectChangedFields(english, input);
  const targets = options.languages?.length
    ? options.languages
    : [...TRANSLATION_LANGUAGES];

  // Persist English fields first as a draft while translations generate.
  await prisma.article.update({
    where: { id: englishArticleId },
    data: {
      title: input.title,
      slug: normalizedSlug,
      content: input.content,
      excerpt: input.excerpt,
      imageUrl: input.imageUrl,
      mainCategory: input.mainCategory,
      category: input.category,
      language: "en",
      translationGroupId: groupId,
      titleEn: input.title,
      summaryEn: input.excerpt,
      contentEn: input.content,
      isPublished: false,
    },
  });

  if (!wantsPublish) {
    return { ok: true };
  }

  const failures: TranslationLanguage[] = [];
  let titleTe = english.titleTe;
  let summaryTe = english.summaryTe;
  let contentTe = english.contentTe;
  let titleHi = english.titleHi;
  let summaryHi = english.summaryHi;
  let contentHi = english.contentHi;

  for (let index = 0; index < targets.length; index += 1) {
    const language = targets[index];
    const existingComplete =
      language === "te"
        ? nonEmpty(titleTe) && nonEmpty(contentTe)
        : nonEmpty(titleHi) && nonEmpty(contentHi);
    const needsTranslation =
      options.forceFields ||
      !existingComplete ||
      changed.title ||
      changed.excerpt ||
      changed.content;

    if (!needsTranslation) continue;

    try {
      if (process.env.NODE_ENV !== "production") {
        console.info("[article-translations-sync]", {
          englishArticleId,
          language,
          slug: normalizedSlug,
          changed,
        });
      }

      const translated: TranslatedArticleFields = await translateWithRetries(
        {
          title: input.title,
          excerpt: input.excerpt,
          content: input.content,
        },
        language,
      );

      if (!translated.title.trim() || !translated.content.trim()) {
        failures.push(language);
        continue;
      }

      if (language === "te") {
        titleTe =
          changed.title || !nonEmpty(titleTe) || options.forceFields
            ? translated.title.trim()
            : titleTe;
        summaryTe =
          changed.excerpt || !nonEmpty(summaryTe) || options.forceFields
            ? translated.excerpt?.trim() || translated.title.trim()
            : summaryTe;
        contentTe =
          changed.content || !nonEmpty(contentTe) || options.forceFields
            ? translated.content.trim()
            : contentTe;
      } else {
        titleHi =
          changed.title || !nonEmpty(titleHi) || options.forceFields
            ? translated.title.trim()
            : titleHi;
        summaryHi =
          changed.excerpt || !nonEmpty(summaryHi) || options.forceFields
            ? translated.excerpt?.trim() || translated.title.trim()
            : summaryHi;
        contentHi =
          changed.content || !nonEmpty(contentHi) || options.forceFields
            ? translated.content.trim()
            : contentHi;
      }
    } catch (error) {
      logDatabaseError(`article-translations-sync.${language}`, error);
      failures.push(language);
    }

    if (index < targets.length - 1) {
      await wait(translationDelayMs());
    }
  }

  const teReady = nonEmpty(titleTe) && nonEmpty(contentTe);
  const hiReady = nonEmpty(titleHi) && nonEmpty(contentHi);

  if (failures.length > 0 || !teReady || !hiReady) {
    await prisma.article.update({
      where: { id: englishArticleId },
      data: {
        titleTe: teReady ? titleTe : english.titleTe,
        summaryTe: teReady ? summaryTe : english.summaryTe,
        contentTe: teReady ? contentTe : english.contentTe,
        titleHi: hiReady ? titleHi : english.titleHi,
        summaryHi: hiReady ? summaryHi : english.summaryHi,
        contentHi: hiReady ? contentHi : english.contentHi,
        isPublished: false,
      },
    });
    const failedList = [
      ...failures,
      ...(!teReady && !failures.includes("te") ? (["te"] as const) : []),
      ...(!hiReady && !failures.includes("hi") ? (["hi"] as const) : []),
    ];
    const uniqueFailures = [...new Set(failedList)];
    return {
      ok: false,
      failures: uniqueFailures,
      error:
        `English was saved as a draft, but ${uniqueFailures
          .map((code) => LANGUAGE_NAMES[code])
          .join(" and ")} translation is incomplete. ` +
        "The article was not published. Use Retry Translation.",
    };
  }

  await prisma.article.update({
    where: { id: englishArticleId },
    data: {
      titleTe,
      summaryTe,
      contentTe,
      titleHi,
      summaryHi,
      contentHi,
      isPublished: true,
    },
  });

  return { ok: true };
}

export async function deleteArticleTranslationGroup(
  translationGroupId: string | null,
) {
  if (!translationGroupId) return false;
  await prisma.article.deleteMany({ where: { translationGroupId } });
  return true;
}
