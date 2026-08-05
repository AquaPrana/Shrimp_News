/**
 * Normalize Article text columns to utf8mb4 / utf8mb4_unicode_ci so LIKE/search
 * does not hit "Illegal mix of collations" (unicode_ci vs bin).
 * Safe to re-run. Does not delete or rewrite article content.
 *
 *   npm run db:migrate-article-collation
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

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

const TEXT_COLUMNS = [
  "title",
  "slug",
  "content",
  "excerpt",
  "imageUrl",
  "mainCategory",
  "category",
] as const;

type ColumnMeta = {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
  EXTRA: string;
  COLLATION_NAME: string | null;
};

async function main() {
  console.log("[migrate] converting Article table to utf8mb4_unicode_ci…");

  await prisma.$executeRawUnsafe(`
    ALTER TABLE \`Article\`
    CONVERT TO CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `);
  console.log("[ok] table CONVERT TO utf8mb4_unicode_ci");

  const columns = await prisma.$queryRawUnsafe<ColumnMeta[]>(`
    SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, COLLATION_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Article'
      AND DATA_TYPE IN ('varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext')
  `);

  for (const column of columns) {
    if (!TEXT_COLUMNS.includes(column.COLUMN_NAME as (typeof TEXT_COLUMNS)[number])) {
      continue;
    }

    if (column.COLLATION_NAME === "utf8mb4_unicode_ci") {
      console.log(`[skip] ${column.COLUMN_NAME} already utf8mb4_unicode_ci`);
      continue;
    }

    const nullable = column.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL";
    const defaultSql =
      column.COLUMN_DEFAULT == null
        ? ""
        : ` DEFAULT ${
            column.COLUMN_DEFAULT === "NULL"
              ? "NULL"
              : `'${String(column.COLUMN_DEFAULT).replace(/'/g, "''")}'`
          }`;
    const extra = column.EXTRA?.trim() ? ` ${column.EXTRA}` : "";

    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`Article\` MODIFY \`${column.COLUMN_NAME}\` ${column.COLUMN_TYPE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ${nullable}${defaultSql}${extra}`,
    );
    console.log(`[ok] ${column.COLUMN_NAME} → utf8mb4_unicode_ci (${column.COLUMN_TYPE})`);
  }

  const sample = await prisma.$queryRawUnsafe<
    Array<{ TABLE_COLLATION: string }>
  >(`
    SELECT TABLE_COLLATION
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Article'
  `);
  console.log("[verify] Article TABLE_COLLATION =", sample[0]?.TABLE_COLLATION);

  console.log("[done] article collation migration complete");
}

main()
  .catch((error) => {
    console.error("[migrate] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
