/**
 * Seeds ticker items + Last Updated meta from the current demo market list.
 * Idempotent: skips item insert when any TickerItem already exists.
 *
 * Usage: npx tsx --env-file=.env.local scripts/seed-ticker.ts
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { fallbackMarketPrices } from "../src/data/fallback-market-prices";

/** 15 Jul 2026, 06:00 PM IST */
const LAST_UPDATED = new Date("2026-07-15T12:30:00.000Z");

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
  await prisma.tickerMeta.upsert({
    where: { id: "default" },
    create: { id: "default", lastUpdated: LAST_UPDATED },
    update: { lastUpdated: LAST_UPDATED },
  });

  const existing = await prisma.tickerItem.count();
  if (existing > 0) {
    console.log(
      `Ticker already has ${existing} item(s). Meta lastUpdated set to 15 Jul 2026, 06:00 PM IST. Skipping item seed.`,
    );
    return;
  }

  await prisma.tickerItem.createMany({
    data: fallbackMarketPrices.map((item, index) => ({
      label: item.label,
      price: item.price,
      currency: item.currency || "INR",
      unit: item.unit,
      changePercent: item.changePercent ?? null,
      direction: item.direction,
      sortOrder: index,
      isActive: true,
      updatedAt: LAST_UPDATED,
    })),
  });

  console.log(
    `Seeded ${fallbackMarketPrices.length} ticker items and Last Updated = 15 Jul 2026, 06:00 PM IST.`,
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
