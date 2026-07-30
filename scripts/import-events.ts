/**
 * Safely imports/corrects the five source-controlled events.
 * Existing status, featured state, and display order are preserved.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { events } from "../src/data/events";

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

function dateAtUtcMidnight(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function backup() {
  const existing = await prisma.event.findMany({ orderBy: { createdAt: "asc" } });
  const directory = path.join(process.cwd(), "backups");
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(directory, `events-before-import-${stamp}.json`);
  await writeFile(
    file,
    JSON.stringify({ createdAt: new Date().toISOString(), existing, source: events }, null, 2),
    "utf8",
  );
  console.log(`Backed up ${existing.length} database event(s) and the local source data to ${file}.`);
}

async function main() {
  await backup();
  let inserted = 0;
  let corrected = 0;

  for (const [displayOrder, event] of events.entries()) {
    const existing = await prisma.event.findFirst({
      where: {
        OR: [{ slug: event.slug }, { title: event.title }],
      },
    });
    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          title: event.title,
          slug: event.slug,
          imageUrl: event.image,
          ...(event.slug === "responsible-seafood-summit-2026"
            ? {
                description: event.description,
                category: event.category,
              }
            : {}),
        },
      });
      corrected += 1;
      continue;
    }

    await prisma.event.create({
      data: {
        title: event.title,
        slug: event.slug,
        shortDescription: event.shortDescription || event.description,
        description: event.description,
        startDate: dateAtUtcMidnight(event.date),
        endDate: event.endDate ? dateAtUtcMidnight(event.endDate) : null,
        dateLabel: event.dateLabel,
        venue: event.venue,
        duration: event.duration,
        category: event.category,
        region: event.region,
        audience: event.audience.join("\n"),
        imageUrl: event.image,
        officialWebsite: event.officialWebsite || null,
        status: "published",
        isFeatured: displayOrder === 0,
        displayOrder,
      },
    });
    inserted += 1;
  }

  const count = await prisma.event.count();
  console.log(
    `Event import verified: ${inserted} inserted, ${corrected} corrected, ${count} total.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
