/**
 * Backfill missing titleTe/contentTe/titleHi/contentHi on English articles.
 * Never overwrites existing non-empty translations.
 *
 *   npm run db:backfill-multilingual-fields
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { translateArticleFields } from "../src/lib/article-translation";

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
  500,
  Number(process.env.GROQ_BACKFILL_DELAY_MS || 2000),
);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nonEmpty(value: string | null | undefined) {
  return Boolean(value?.trim());
}

async function translateWithRetry(
  source: { title: string; excerpt: string | null; content: string },
  languageName: string,
) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await translateArticleFields(source, languageName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[retry ${attempt}] ${languageName}: ${message}`);
      if (attempt === 3) throw error;
      await wait(delayMs * attempt);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const articles = await prisma.article.findMany({
    where: { language: "en" },
    orderBy: { createdAt: "desc" },
  });

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`[start] checking ${articles.length} English articles`);

  for (const article of articles) {
    const titleEn = article.titleEn?.trim() || article.title;
    const summaryEn = article.summaryEn?.trim() || article.excerpt;
    const contentEn = article.contentEn?.trim() || article.content;

    // Ensure English mirrors are stored.
    if (
      !nonEmpty(article.titleEn) ||
      !nonEmpty(article.contentEn) ||
      article.summaryEn == null
    ) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          titleEn,
          summaryEn,
          contentEn,
        },
      });
    }

    for (const language of ["te", "hi"] as const) {
      const hasTitle =
        language === "te"
          ? nonEmpty(article.titleTe)
          : nonEmpty(article.titleHi);
      const hasContent =
        language === "te"
          ? nonEmpty(article.contentTe)
          : nonEmpty(article.contentHi);

      if (hasTitle && hasContent) {
        skipped += 1;
        console.log(`[skipped:${language}] ${article.slug}`);
        continue;
      }

      try {
        const fields = await translateWithRetry(
          {
            title: titleEn,
            excerpt: summaryEn,
            content: contentEn,
          },
          language === "te" ? "Telugu" : "Hindi",
        );

        if (!fields.title.trim() || !fields.content.trim()) {
          failed += 1;
          console.error(`[failed:${language}] empty result ${article.slug}`);
          continue;
        }

        await prisma.article.update({
          where: { id: article.id },
          data:
            language === "te"
              ? {
                  titleTe: hasTitle ? article.titleTe : fields.title.trim(),
                  summaryTe: nonEmpty(article.summaryTe)
                    ? article.summaryTe
                    : fields.excerpt?.trim() || fields.title.trim(),
                  contentTe: hasContent
                    ? article.contentTe
                    : fields.content.trim(),
                }
              : {
                  titleHi: hasTitle ? article.titleHi : fields.title.trim(),
                  summaryHi: nonEmpty(article.summaryHi)
                    ? article.summaryHi
                    : fields.excerpt?.trim() || fields.title.trim(),
                  contentHi: hasContent
                    ? article.contentHi
                    : fields.content.trim(),
                },
        });

        translated += 1;
        console.log(
          `[translated:${language}] ${article.slug} → ${fields.title.slice(0, 60)}`,
        );
      } catch (error) {
        failed += 1;
        console.error(
          `[failed:${language}] ${article.slug}`,
          error instanceof Error ? error.message : error,
        );
      }

      await wait(delayMs);
    }
  }

  console.log(
    `[done] translated=${translated} skipped=${skipped} failed=${failed}`,
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
