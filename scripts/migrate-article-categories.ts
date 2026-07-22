/**
 * Adds mainCategory and remaps legacy National/International category values.
 *
 * Usage: npx tsx --env-file=.env.local scripts/migrate-article-categories.ts
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
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

async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, category: true, mainCategory: true, slug: true },
  });

  let updated = 0;
  for (const article of articles) {
    const taxonomy = resolveArticleTaxonomy({
      mainCategory: article.mainCategory,
      category: article.category,
    });

    // Force all non-International legacy rows to India; International → Global.
    if (
      article.category === "International" ||
      article.category === "Global" ||
      article.mainCategory === "Global" ||
      article.mainCategory === "International"
    ) {
      taxonomy.mainCategory = "Global";
      if (
        article.category === "International" ||
        article.category === "Global" ||
        article.category === "National" ||
        article.category === "India"
      ) {
        taxonomy.category = "Markets & Industry";
      }
    } else {
      taxonomy.mainCategory = "India";
      if (article.category === "National" || article.category === "India") {
        taxonomy.category = "Markets & Industry";
      }
    }

    if (
      article.mainCategory === taxonomy.mainCategory &&
      article.category === taxonomy.category
    ) {
      continue;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: {
        mainCategory: taxonomy.mainCategory,
        category: taxonomy.category,
      },
    });
    updated += 1;
    console.log(
      `Updated ${article.slug}: ${taxonomy.mainCategory} / ${taxonomy.category}`,
    );
  }

  console.log(`Done. Updated ${updated} of ${articles.length} articles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
