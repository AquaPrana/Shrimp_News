import { prisma } from "@/lib/prisma";

/** Atomic, retry-safe promotion; timestamps use the database UTC clock. */
export async function publishScheduledArticles() {
  return prisma.$executeRaw`
    UPDATE Article
    SET isPublished = TRUE, publishedAt = scheduledAt, updatedAt = UTC_TIMESTAMP(3)
    WHERE isPublished = FALSE AND scheduledAt IS NOT NULL
      AND scheduledAt <= UTC_TIMESTAMP(3)
  `;
}
