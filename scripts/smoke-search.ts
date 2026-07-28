/**
 * Smoke-test article search SQL (same logic as queryPublishedArticles search path).
 *   npx tsx --env-file=.env.local scripts/smoke-search.ts
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "@prisma/client";

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

function searchWordSqlCondition(word: string) {
  const like = `%${word}%`;
  const compact = `%${word.replace(/\s+/g, "")}%`;
  return Prisma.sql`(
    \`title\` COLLATE utf8mb4_unicode_ci LIKE ${like}
    OR COALESCE(\`titleEn\`, '') COLLATE utf8mb4_unicode_ci LIKE ${like}
    OR COALESCE(\`excerpt\`, '') COLLATE utf8mb4_unicode_ci LIKE ${like}
    OR COALESCE(\`summaryEn\`, '') COLLATE utf8mb4_unicode_ci LIKE ${like}
    OR \`content\` COLLATE utf8mb4_unicode_ci LIKE ${like}
    OR COALESCE(\`contentEn\`, '') COLLATE utf8mb4_unicode_ci LIKE ${like}
    OR REPLACE(\`title\`, ' ', '') COLLATE utf8mb4_unicode_ci LIKE ${compact}
    OR REPLACE(COALESCE(\`titleEn\`, ''), ' ', '') COLLATE utf8mb4_unicode_ci LIKE ${compact}
    OR REPLACE(COALESCE(\`excerpt\`, ''), ' ', '') COLLATE utf8mb4_unicode_ci LIKE ${compact}
    OR REPLACE(COALESCE(\`summaryEn\`, ''), ' ', '') COLLATE utf8mb4_unicode_ci LIKE ${compact}
    OR REPLACE(\`content\`, ' ', '') COLLATE utf8mb4_unicode_ci LIKE ${compact}
    OR REPLACE(COALESCE(\`contentEn\`, ''), ' ', '') COLLATE utf8mb4_unicode_ci LIKE ${compact}
  )`;
}

async function search(q: string) {
  const words = q.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const wordSql = Prisma.join(
    words.map((word) => searchWordSqlCondition(word)),
    " AND ",
  );
  return prisma.$queryRaw<{ id: string; title: string }[]>`
    SELECT \`id\`, \`title\`
    FROM \`Article\`
    WHERE \`isPublished\` = true
      AND \`language\` = 'en'
      AND ${wordSql}
    ORDER BY \`createdAt\` DESC
    LIMIT 5
  `;
}

async function main() {
  const tests = [
    "andhra",
    "pradesh",
    "Andhra Pradesh",
    "andhrapradesh",
    "shrimp feed",
    "aquaculture",
    "  andhra  ",
  ];

  for (const q of tests) {
    try {
      const rows = await search(q);
      console.log(
        JSON.stringify({
          q,
          count: rows.length,
          titles: rows.map((row) => row.title).slice(0, 2),
        }),
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          q,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
