/**
 * Adds flat multilingual columns and copies existing en/te/hi row data into them.
 * Safe to re-run. Does not call Groq.
 *
 *   npm run db:migrate-multilingual-columns
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { baseSlug } from "../src/lib/public-articles-shared";

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

const COLUMNS: Array<{ name: string; sql: string }> = [
  { name: "titleEn", sql: "ALTER TABLE `Article` ADD COLUMN `titleEn` TEXT NULL" },
  { name: "summaryEn", sql: "ALTER TABLE `Article` ADD COLUMN `summaryEn` TEXT NULL" },
  { name: "contentEn", sql: "ALTER TABLE `Article` ADD COLUMN `contentEn` LONGTEXT NULL" },
  { name: "titleTe", sql: "ALTER TABLE `Article` ADD COLUMN `titleTe` TEXT NULL" },
  { name: "summaryTe", sql: "ALTER TABLE `Article` ADD COLUMN `summaryTe` TEXT NULL" },
  { name: "contentTe", sql: "ALTER TABLE `Article` ADD COLUMN `contentTe` LONGTEXT NULL" },
  { name: "titleHi", sql: "ALTER TABLE `Article` ADD COLUMN `titleHi` TEXT NULL" },
  { name: "summaryHi", sql: "ALTER TABLE `Article` ADD COLUMN `summaryHi` TEXT NULL" },
  { name: "contentHi", sql: "ALTER TABLE `Article` ADD COLUMN `contentHi` LONGTEXT NULL" },
];

async function columnExists(name: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ Field: string }>>(
    "SHOW COLUMNS FROM `Article`",
  );
  return rows.some((row) => row.Field === name);
}

async function main() {
  console.log("[migrate] ensuring multilingual columns exist…");
  for (const column of COLUMNS) {
    if (await columnExists(column.name)) {
      console.log(`[skip] column ${column.name} already exists`);
      continue;
    }
    await prisma.$executeRawUnsafe(column.sql);
    console.log(`[added] ${column.name}`);
  }

  const englishArticles = await prisma.article.findMany({
    where: { language: "en" },
  });
  console.log(`[migrate] copying translations into ${englishArticles.length} English articles…`);

  let updated = 0;
  for (const english of englishArticles) {
    const groupVersions = await prisma.article.findMany({
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
    const te =
      groupVersions.find((row) => row.language === "te") ||
      (await prisma.article.findFirst({
        where: { slug: `${baseSlug(english.slug)}-te` },
      }));
    const hi =
      groupVersions.find((row) => row.language === "hi") ||
      (await prisma.article.findFirst({
        where: { slug: `${baseSlug(english.slug)}-hi` },
      }));

    const titleEn = english.titleEn?.trim() || english.title;
    const summaryEn = english.summaryEn?.trim() || english.excerpt;
    const contentEn = english.contentEn?.trim() || english.content;
    // Never overwrite already-populated multilingual columns.
    const titleTe = english.titleTe?.trim() || te?.title || null;
    const summaryTe = english.summaryTe?.trim() || te?.excerpt || null;
    const contentTe = english.contentTe?.trim() || te?.content || null;
    const titleHi = english.titleHi?.trim() || hi?.title || null;
    const summaryHi = english.summaryHi?.trim() || hi?.excerpt || null;
    const contentHi = english.contentHi?.trim() || hi?.content || null;

    await prisma.article.update({
      where: { id: english.id },
      data: {
        titleEn,
        summaryEn,
        contentEn,
        titleTe,
        summaryTe,
        contentTe,
        titleHi,
        summaryHi,
        contentHi,
      },
    });
    updated += 1;
    console.log(`[copied] ${english.slug} te=${Boolean(titleTe)} hi=${Boolean(titleHi)}`);
  }

  console.log(`[done] updated=${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
