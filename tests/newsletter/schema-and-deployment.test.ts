import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/202607310001_add_newsletter_system/migration.sql",
  "utf8",
);
const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  crons?: Array<{ path: string; schedule: string }>;
};
const envExample = readFileSync(".env.example", "utf8");

test("subscriber schema has unique email/token and permanent weekly deduplication", () => {
  assert.match(schema, /email\s+String\s+@unique/);
  assert.match(schema, /unsubscribeToken\s+String\?\s+@unique/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /welcomeEmailSent\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /@@unique\(\[subscriberId, newsletterWeek\]\)/);
});

test("migration is additive and preserves existing subscription dates", () => {
  assert.match(migration, /SET `subscribedAt` = `createdAt`/);
  assert.match(migration, /RANDOM_BYTES\(32\)/);
  assert.doesNotMatch(migration, /^\s*(?:DROP|DELETE|TRUNCATE)\b/im);
});

test("Vercel cron is Monday 9 AM IST and required settings are documented", () => {
  assert.deepEqual(vercel.crons, [
    {
      path: "/api/cron/weekly-newsletter",
      schedule: "30 3 * * 1",
    },
  ]);
  for (const variable of [
    "RESEND_API_KEY",
    "NEWSLETTER_FROM_EMAIL",
    "NEXT_PUBLIC_SITE_URL",
    "CRON_SECRET",
  ]) {
    assert.match(envExample, new RegExp(`^${variable}=`, "m"));
  }
});
