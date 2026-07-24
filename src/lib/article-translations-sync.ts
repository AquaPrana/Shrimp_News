import "server-only";

import type { Article, Prisma } from "@prisma/client";
import { hasCompleteArticleTranslation } from "@/lib/article-localization";
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

function translatedData(
  english: Article,
  input: PrismaArticleInput,
  groupId: string,
  language: TranslationLanguage,
  translated: TranslatedArticleFields,
) {
  return {
    title: translated.title,
    excerpt: translated.excerpt,
    content: translated.content,
    slug: `${baseSlug(input.slug)}-${language}`,
    imageUrl: input.imageUrl,
    mainCategory: input.mainCategory,
    category: input.category,
    language,
    translationGroupId: groupId,
    isPublished: true,
    createdAt: english.createdAt,
  };
}

function mergeTranslatedFields(
  existing: Article | undefined,
  next: TranslatedArticleFields,
  changed: { title: boolean; excerpt: boolean; content: boolean },
): TranslatedArticleFields {
  return {
    title:
      changed.title && next.title.trim()
        ? next.title.trim()
        : existing?.title?.trim() || next.title.trim(),
    excerpt:
      changed.excerpt && next.excerpt?.trim()
        ? next.excerpt.trim()
        : existing?.excerpt?.trim() || next.excerpt?.trim() || null,
    content:
      changed.content && next.content.trim()
        ? next.content.trim()
        : existing?.content?.trim() || next.content.trim(),
  };
}

function detectChangedFields(english: Article, input: PrismaArticleInput) {
  return {
    title: english.title.trim() !== input.title.trim(),
    excerpt: (english.excerpt || "").trim() !== (input.excerpt || "").trim(),
    content: english.content.trim() !== input.content.trim(),
  };
}

async function loadGroupVersions(english: Article) {
  return prisma.article.findMany({
    where: english.translationGroupId
      ? { translationGroupId: english.translationGroupId }
      : {
          slug: {
            in: [
              baseSlug(english.slug),
              `${baseSlug(english.slug)}-te`,
              `${baseSlug(english.slug)}-hi`,
            ],
          },
        },
  });
}

export async function getArticleTranslationStatus(article: Article) {
  const versions = await loadGroupVersions(article);
  const statusFor = (language: TranslationLanguage): TranslationStatusValue => {
    const version = versions.find((row) => row.language === language);
    if (!version) return "missing";
    if (hasCompleteArticleTranslation(version)) return "available";
    if (version.title.trim() || version.content.trim()) return "pending";
    return "failed";
  };

  return {
    en: "available" as const,
    te: statusFor("te"),
    hi: statusFor("hi"),
  };
}

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
  const sourceData = {
    title: input.title,
    slug: normalizedSlug,
    content: input.content,
    excerpt: input.excerpt,
    imageUrl: input.imageUrl,
    mainCategory: input.mainCategory,
    category: input.category,
    language: "en",
    translationGroupId: groupId,
  } satisfies Prisma.ArticleUpdateInput;

  // Always persist the English source first — never hide it when translation fails.
  await prisma.article.update({
    where: { id: englishArticleId },
    data: {
      ...sourceData,
      isPublished: input.isPublished,
    },
  });

  if (!input.isPublished) {
    await prisma.article.updateMany({
      where: {
        translationGroupId: groupId,
        language: { in: [...TRANSLATION_LANGUAGES] },
      },
      data: {
        isPublished: false,
        imageUrl: input.imageUrl,
        mainCategory: input.mainCategory,
        category: input.category,
      },
    });
    return { ok: true };
  }

  const versions = await loadGroupVersions({
    ...english,
    translationGroupId: groupId,
    slug: normalizedSlug,
  });
  const changed = options.forceFields
    ? { title: true, excerpt: true, content: true }
    : detectChangedFields(english, input);
  const needsAnyField = changed.title || changed.excerpt || changed.content;
  const targets = options.languages?.length
    ? options.languages
    : [...TRANSLATION_LANGUAGES];

  const failures: TranslationLanguage[] = [];

  for (const language of targets) {
    const existing = versions.find((row) => row.language === language);
    const complete = existing && hasCompleteArticleTranslation(existing);
    if (complete && !needsAnyField && !options.forceFields) {
      await prisma.article.update({
        where: { id: existing.id },
        data: {
          imageUrl: input.imageUrl,
          mainCategory: input.mainCategory,
          category: input.category,
          isPublished: true,
          translationGroupId: groupId,
        },
      });
      continue;
    }

    try {
      const translated = await translateArticleFields(
        {
          title: input.title,
          excerpt: input.excerpt,
          content: input.content,
        },
        LANGUAGE_NAMES[language],
      );
      const merged = mergeTranslatedFields(existing, translated, {
        title: options.forceFields || changed.title || !existing?.title?.trim(),
        excerpt:
          options.forceFields ||
          changed.excerpt ||
          !existing?.excerpt?.trim(),
        content:
          options.forceFields ||
          changed.content ||
          !existing?.content?.trim(),
      });

      if (!merged.title.trim() || !merged.content.trim()) {
        failures.push(language);
        continue;
      }

      const data = translatedData(
        english,
        { ...input, slug: normalizedSlug },
        groupId,
        language,
        merged,
      );
      await prisma.article.upsert({
        where: { slug: data.slug },
        create: data,
        update: {
          ...data,
          // Never blank out a good translation with an empty value.
          title: data.title.trim() ? data.title : undefined,
          excerpt: data.excerpt?.trim() ? data.excerpt : undefined,
          content: data.content.trim() ? data.content : undefined,
        },
      });
    } catch (error) {
      logDatabaseError(`article-translations-sync.${language}`, error);
      failures.push(language);
    }
  }

  if (failures.length > 0) {
    return {
      ok: false,
      failures,
      error:
        `English article was saved${input.isPublished ? " and published" : ""}, but ${failures
          .map((code) => LANGUAGE_NAMES[code])
          .join(" and ")} translation failed. Use Retry Translation.`,
    };
  }

  return { ok: true };
}

export async function deleteArticleTranslationGroup(
  translationGroupId: string | null,
) {
  if (!translationGroupId) return false;
  await prisma.article.deleteMany({ where: { translationGroupId } });
  return true;
}
