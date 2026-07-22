import "server-only";

import type { Article } from "@prisma/client";
import { translateArticleToAllLanguages } from "@/lib/article-translation";
import { baseSlug, localizedSlug } from "@/lib/public-articles";
import { logDatabaseError, prisma } from "@/lib/prisma";
import type { PrismaArticleInput } from "@/lib/validation";

const TRANSLATION_LANGUAGES = ["te", "hi"] as const;

function sharedArticleFields(english: Article, input: PrismaArticleInput) {
  return {
    imageUrl: input.imageUrl,
    mainCategory: input.mainCategory,
    category: input.category,
    isPublished: input.isPublished,
    createdAt: english.createdAt,
  };
}

async function upsertTranslatedArticle(
  english: Article,
  input: PrismaArticleInput,
  groupId: string,
  language: (typeof TRANSLATION_LANGUAGES)[number],
  translated: { title: string; excerpt: string | null; content: string },
) {
  const slug = localizedSlug(baseSlug(input.slug), language);
  const shared = sharedArticleFields(english, input);

  await prisma.article.upsert({
    where: { slug },
    create: {
      title: translated.title,
      slug,
      content: translated.content,
      excerpt: translated.excerpt,
      language,
      translationGroupId: groupId,
      ...shared,
    },
    update: {
      title: translated.title,
      content: translated.content,
      excerpt: translated.excerpt,
      translationGroupId: groupId,
      ...shared,
    },
  });
}

export async function syncArticleTranslations(
  englishArticleId: string,
  input: PrismaArticleInput,
) {
  if (input.language !== "en") return;

  const english = await prisma.article.findUnique({ where: { id: englishArticleId } });
  if (!english) return;

  const groupId = english.translationGroupId || crypto.randomUUID();
  const normalizedSlug = baseSlug(input.slug);

  await prisma.article.update({
    where: { id: englishArticleId },
    data: {
      translationGroupId: groupId,
      slug: normalizedSlug,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      imageUrl: input.imageUrl,
      mainCategory: input.mainCategory,
      category: input.category,
      language: "en",
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
    return;
  }

  const translations = await translateArticleToAllLanguages({
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
  });

  for (const language of TRANSLATION_LANGUAGES) {
    const result = translations[language];
    if (!result.ok) {
      console.error(
        `[article-translations-sync] Skipped ${language} translation for article ${englishArticleId}: ${result.error}`,
      );
      continue;
    }

    try {
      await upsertTranslatedArticle(
        english,
        { ...input, slug: normalizedSlug },
        groupId,
        language,
        result.value,
      );
    } catch (error) {
      logDatabaseError(`article-translations-sync.${language}`, error);
      console.error(
        `[article-translations-sync] Failed to save ${language} translation for article ${englishArticleId}.`,
      );
    }
  }
}

export async function deleteArticleTranslationGroup(translationGroupId: string | null) {
  if (!translationGroupId) return false;
  await prisma.article.deleteMany({ where: { translationGroupId } });
  return true;
}
