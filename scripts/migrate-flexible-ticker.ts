/**
 * Backs up and maps legacy market rows to flexible ticker values.
 * Matching labels are reused; no duplicate fixed item is inserted.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { fallbackMarketPrices } from "../src/data/fallback-market-prices";

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

function formattedValue(item: (typeof fallbackMarketPrices)[number]) {
  let value: string;
  if (item.unit === "MT") {
    value = `${Number((item.price / 100_000).toFixed(2))} lakh MT`;
  } else if (item.unit === "kg") {
    const symbol = item.currency === "USD" ? "$" : item.currency === "INR" ? "₹" : "";
    value = `${symbol}${item.price}/kg`;
  } else {
    value = `${item.currency === "USD" ? "$" : item.currency === "INR" ? "₹" : ""}${item.price}`;
  }
  if (item.changePercent != null) {
    const marker = item.direction === "up" ? "▲" : item.direction === "down" ? "▼" : "";
    value += ` ${marker} ${Math.abs(item.changePercent)}%`.replace("  ", " ");
  }
  return value;
}

async function backup() {
  const [items, meta] = await Promise.all([
    prisma.tickerItem.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tickerMeta.findUnique({ where: { id: "default" } }),
  ]);
  const directory = path.join(process.cwd(), "backups");
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(directory, `ticker-before-flexible-import-${stamp}.json`);
  await writeFile(file, JSON.stringify({ createdAt: new Date().toISOString(), items, meta }, null, 2), "utf8");
  console.log(`Backed up ${items.length} ticker item(s) and ticker meta to ${file}.`);
}

async function main() {
  await backup();
  let inserted = 0;
  let reused = 0;

  for (const [displayOrder, source] of fallbackMarketPrices.entries()) {
    const existing = await prisma.tickerItem.findFirst({
      where: { label: source.label },
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      const currentValue = existing.value.trim();
      const migrationPlaceholder =
        !currentValue || currentValue === String(existing.price);

      await prisma.tickerItem.update({
        where: { id: existing.id },
        data: {
          value: migrationPlaceholder ? formattedValue(source) : currentValue,
          type: existing.type || "market",
          displayOrder: existing.displayOrder === 0 && displayOrder > 0
            ? displayOrder
            : existing.displayOrder,
        },
      });
      reused += 1;
      continue;
    }

    await prisma.tickerItem.create({
      data: {
        label: source.label,
        value: formattedValue(source),
        type: "market",
        displayOrder,
        price: source.price,
        currency: source.currency || "INR",
        unit: source.unit,
        changePercent: source.changePercent ?? null,
        direction: source.direction,
        sortOrder: displayOrder,
        isActive: source.isActive,
      },
    });
    inserted += 1;
  }

  const items = await prisma.tickerItem.findMany({
    select: { id: true, label: true, value: true, displayOrder: true, isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  if (items.some((item) => !item.value.trim())) {
    throw new Error("Verification failed: at least one ticker item has an empty value.");
  }
  console.log(`Flexible ticker verified: ${inserted} inserted, ${reused} legacy rows reused, ${items.length} total.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
