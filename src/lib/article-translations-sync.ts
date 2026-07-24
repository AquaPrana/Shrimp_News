import "server-only";

import type { Article, Prisma } from "@prisma/client";
import { hasCompleteArticleTranslation } from "@/lib/article-localization";
import { translateArticleToAllLanguages } from "@/lib/article-translation";
import { baseSlug } from "@/lib/public-articles-shared";
import { logDatabaseError, prisma } from "@/lib/prisma";
import type { PrismaArticleInput } from "@/lib/validation";

const TRANSLATION_LANGUAGES = ["te", "hi"] as const;

export type TranslationSyncResult =
  | { ok: true }
  | { ok: false; error: string; failures: Array<"te" | "hi"> };

function translatedData(
  english: Article,
  input: PrismaArticleInput,
  groupId: string,
  language: (typeof TRANSLATION_LANGUAGES)[number],
  translated: { title: string; excerpt: string | null; content: string },
) {
  return {
    ...translated,
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

export async function getArticleTranslationStatus(article: Article) {
  const versions = await prisma.article.findMany({
    where: article.translationGroupId
      ? { translationGroupId: article.translationGroupId }
      : {
          slug: {
            in: [
              baseSlug(article.slug),
              `${baseSlug(article.slug)}-te`,
              `${baseSlug(article.slug)}-hi`,
            ],
          },
        },
  });
  const available = (language: "te" | "hi") =>
    versions.some(
      (version) =>
        version.language === language &&
        hasCompleteArticleTranslation(version),
    );
  return {
    en: "available" as const,
    te: available("te") ? ("available" as const) : ("missing" as const),
    hi: available("hi") ? ("available" as const) : ("missing" as const),
  };
}

export async function syncArticleTranslations(
  englishArticleId: string,
  input: PrismaArticleInput,
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

  if (!input.isPublished) {
    await prisma.$transaction([
      prisma.article.update({
        where: { id: englishArticleId },
        data: { ...sourceData, isPublished: false },
      }),
      prisma.article.updateMany({
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
      }),
    ]);
    return { ok: true };
  }

  const translations = await translateArticleToAllLanguages({
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
  });
  const failures = TRANSLATION_LANGUAGES.filter(
    (language) => !translations[language].ok,
  );

  if (failures.length > 0) {
    await prisma.$transaction([
      prisma.article.update({
        where: { id: englishArticleId },
        data: { ...sourceData, isPublished: false },
      }),
      prisma.article.updateMany({
        where: { translationGroupId: groupId },
        data: { isPublished: false },
      }),
    ]);
    return {
      ok: false,
      failures: [...failures],
      error:
        `English was saved safely as a draft, but ${failures.join(" and ")} translation failed. ` +
        "Use Retry Translation after checking the Groq configuration.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: englishArticleId },
        data: { ...sourceData, isPublished: true },
      });
      for (const language of TRANSLATION_LANGUAGES) {
        const result = translations[language];
        if (!result.ok) continue;
        const data = translatedData(
          english,
          { ...input, slug: normalizedSlug },
          groupId,
          language,
          result.value,
        );
        await tx.article.upsert({
          where: { slug: data.slug },
          create: data,
          update: data,
        });
      }
    });
    return { ok: true };
  } catch (error) {
    logDatabaseError("article-translations-sync.save", error);
    await prisma.article.update({
      where: { id: englishArticleId },
      data: { ...sourceData, isPublished: false },
    });
    return {
      ok: false,
      failures: ["te", "hi"],
      error:
        "English was saved safely as a draft, but translated content could not be saved. Use Retry Translation.",
    };
  }
}

export async function deleteArticleTranslationGroup(
  translationGroupId: string | null,
) {
  if (!translationGroupId) return false;
  await prisma.article.deleteMany({ where: { translationGroupId } });
  return true;
}
