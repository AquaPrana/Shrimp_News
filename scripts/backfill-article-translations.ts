/**
 * Safe, idempotent article translation/category backfill.
 *
 * Creates a complete JSON backup before the first database write, normalizes
 * region keys, and fills only missing or clearly untranslated te/hi fields.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, type Article } from "@prisma/client";
import {
  hasCompleteArticleTranslation,
} from "../src/lib/article-localization";
import { translateArticleFields } from "../src/lib/article-translation";
import { baseSlug } from "../src/lib/public-articles-shared";
import { resolveArticleTaxonomy } from "../src/lib/article-types";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: required("DATABASE_HOST"),
    port: Number(process.env.DATABASE_PORT || 3306),
    user: required("DATABASE_USER"),
    password: required("DATABASE_PASSWORD"),
    database: required("DATABASE_NAME"),
  }),
});

const delayMs = Math.max(
  250,
  Number(process.env.GROQ_BACKFILL_DELAY_MS || 1200),
);

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function translateWithRateLimitRetry(
  source: { title: string; excerpt: string | null; content: string },
  targetLanguageName: string,
) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await translateArticleFields(source, targetLanguageName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryMatch = message.match(/try again in ([\d.]+)s/i);
      if (!/\b429\b|rate limit/i.test(message) || attempt === 4) throw error;
      const retrySeconds = retryMatch ? Number(retryMatch[1]) : attempt * 5;
      if (retrySeconds > 60) throw error;
      const retryDelay = Math.max(
        delayMs,
        Math.ceil(retrySeconds * 1000) + 750,
      );
      console.log(
        `[rate-limit] waiting ${retryDelay}ms before attempt ${attempt + 1}`,
      );
      await wait(retryDelay);
    }
  }
  throw new Error("Translation retry limit reached.");
}

function plainText(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackSummary(content: string) {
  const text = plainText(content);
  return text.length <= 320 ? text : `${text.slice(0, 317).trim()}…`;
}

function scriptCharacterCount(value: string, language: "te" | "hi") {
  const expression =
    language === "te" ? /[\u0C00-\u0C7F]/g : /[\u0900-\u097F]/g;
  return value.match(expression)?.length || 0;
}

function isMissingOrUntranslated(
  value: string | null,
  englishValue: string | null,
  language: "te" | "hi",
) {
  const candidate = plainText(value || "");
  const source = plainText(englishValue || "");
  if (!candidate) return true;
  if (source && candidate.toLocaleLowerCase() === source.toLocaleLowerCase()) {
    return true;
  }
  const minimumScriptCharacters = candidate.length < 80 ? 1 : 5;
  const scriptCharacters = scriptCharacterCount(candidate, language);
  if (scriptCharacters < minimumScriptCharacters) return true;
  if (candidate.length >= 120) {
    const letterCount = candidate.match(/\p{L}/gu)?.length || candidate.length;
    return scriptCharacters / Math.max(letterCount, 1) < 0.12;
  }
  return false;
}

function needsBackfill(
  version: Article | undefined,
  english: Article,
  language: "te" | "hi",
) {
  if (!version || !hasCompleteArticleTranslation(version)) return true;
  return (
    isMissingOrUntranslated(version.title, english.title, language) ||
    isMissingOrUntranslated(version.excerpt, english.excerpt, language) ||
    isMissingOrUntranslated(version.content, english.content, language)
  );
}

async function createBackup(articles: Article[]) {
  const directory = path.join(process.cwd(), "backups");
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(directory, `articles-before-backfill-${timestamp}.json`);
  await writeFile(file, JSON.stringify(articles, null, 2), "utf8");
  console.log(`[backup] ${file}`);
}

async function main() {
  const originalArticles = await prisma.article.findMany({
    orderBy: { createdAt: "asc" },
  });
  await createBackup(originalArticles);

  let normalized = 0;
  for (const article of originalArticles) {
    const taxonomy = resolveArticleTaxonomy({
      mainCategory: article.mainCategory,
      category: article.category,
    });
    if (
      article.mainCategory !== taxonomy.mainCategory ||
      article.category !== taxonomy.category
    ) {
      await prisma.article.update({
        where: { id: article.id },
        data: taxonomy,
      });
      normalized += 1;
      console.log(
        `[category] ${article.slug} -> ${taxonomy.mainCategory}/${taxonomy.category}`,
      );
    }
  }

  const englishArticles = await prisma.article.findMany({
    where: { language: "en", isPublished: true },
    orderBy: { createdAt: "asc" },
  });
  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const english of englishArticles) {
    const groupId = english.translationGroupId || crypto.randomUUID();
    const excerpt = english.excerpt?.trim() || fallbackSummary(english.content);
    await prisma.article.update({
      where: { id: english.id },
      data: {
        translationGroupId: groupId,
        excerpt,
        mainCategory: resolveArticleTaxonomy({
          mainCategory: english.mainCategory,
          category: english.category,
        }).mainCategory,
      },
    });

    const versions = await prisma.article.findMany({
      where: {
        OR: [
          { translationGroupId: groupId },
          {
            slug: {
              in: [
                `${baseSlug(english.slug)}-te`,
                `${baseSlug(english.slug)}-hi`,
              ],
            },
          },
        ],
      },
    });

    await prisma.article.updateMany({
      where: {
        id: { in: versions.map((version) => version.id) },
      },
      data: {
        mainCategory: resolveArticleTaxonomy({
          mainCategory: english.mainCategory,
          category: english.category,
        }).mainCategory,
        category: english.category,
      },
    });

    for (const language of ["te", "hi"] as const) {
      const existing = versions.find(
        (version) => version.language === language,
      );
      if (!needsBackfill(existing, { ...english, excerpt }, language)) {
        skipped += 1;
        console.log(`[skip:${language}] ${english.slug} already complete`);
        continue;
      }

      try {
        const generated = await translateWithRateLimitRetry(
          { title: english.title, excerpt, content: english.content },
          language === "te" ? "Telugu" : "Hindi",
        );
        const title = isMissingOrUntranslated(
          existing?.title || null,
          english.title,
          language,
        )
          ? generated.title
          : existing!.title;
        const translatedExcerpt = isMissingOrUntranslated(
          existing?.excerpt || null,
          excerpt,
          language,
        )
          ? generated.excerpt
          : existing!.excerpt;
        const content = isMissingOrUntranslated(
          existing?.content || null,
          english.content,
          language,
        )
          ? generated.content
          : existing!.content;
        const data = {
          title,
          excerpt: translatedExcerpt,
          content,
          imageUrl: english.imageUrl,
          mainCategory: resolveArticleTaxonomy({
            mainCategory: english.mainCategory,
            category: english.category,
          }).mainCategory,
          category: english.category,
          language,
          translationGroupId: groupId,
          isPublished: english.isPublished,
          createdAt: english.createdAt,
        };
        await prisma.article.upsert({
          where: { slug: `${baseSlug(english.slug)}-${language}` },
          create: {
            ...data,
            slug: `${baseSlug(english.slug)}-${language}`,
          },
          update: data,
        });
        translated += 1;
        console.log(`[success:${language}] ${english.slug}`);
      } catch (error) {
        failed += 1;
        console.error(
          `[failed:${language}] ${english.slug}`,
          error instanceof Error ? error.message : error,
        );
      }
      await wait(delayMs);
    }
  }

  console.log(
    `[done] category rows normalized=${normalized}, translations saved=${translated}, skipped=${skipped}, failed=${failed}`,
  );
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
