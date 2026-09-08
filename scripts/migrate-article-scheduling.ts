import { prisma } from "../src/lib/prisma";

// Rerunnable for installations whose historical schema was installed manually.
async function main() {
  const columns = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Article'
  `;
  if (!columns.length) throw new Error("The active Article table was not found; no changes made.");
  const names = new Set(columns.map((column) => column.COLUMN_NAME));
  if (!names.has("scheduledAt")) {
    await prisma.$executeRaw`ALTER TABLE Article ADD COLUMN scheduledAt DATETIME(3) NULL`;
  }
  if (!names.has("publishedAt")) {
    await prisma.$executeRaw`ALTER TABLE Article ADD COLUMN publishedAt DATETIME(3) NULL`;
  }
  const indexes = await prisma.$queryRaw<Array<{ INDEX_NAME: string }>>`
    SELECT INDEX_NAME FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Article'
      AND INDEX_NAME = 'Article_isPublished_scheduledAt_idx'
  `;
  if (!indexes.length) {
    await prisma.$executeRaw`CREATE INDEX Article_isPublished_scheduledAt_idx ON Article (isPublished, scheduledAt)`;
  }
  await prisma.$executeRaw`
    UPDATE Article SET publishedAt = createdAt
    WHERE isPublished = TRUE AND publishedAt IS NULL AND scheduledAt IS NULL
  `;
  console.log("Article scheduling migration complete. Existing content and placement flags preserved.");
}

main().catch(() => {
  console.error("Article scheduling migration failed. Check database access and schema permissions; safe to rerun.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
