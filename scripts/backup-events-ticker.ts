/**
 * Read-only pre-migration backup for the legacy ticker tables and local events.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { events } from "../src/data/events";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function main() {
  const connection = await mysql.createConnection({
    host: required("DATABASE_HOST"),
    port: Number(process.env.DATABASE_PORT || 3306),
    user: required("DATABASE_USER"),
    password: required("DATABASE_PASSWORD"),
    database: required("DATABASE_NAME"),
  });

  try {
    const snapshot: Record<string, unknown> = {
      createdAt: new Date().toISOString(),
      localEvents: events,
      database: {},
    };
    const database = snapshot.database as Record<string, unknown>;

    for (const table of [
      "TickerItem",
      "TickerMeta",
      "Event",
      "Admin",
      "AdminSessionRecord",
      "AdminPasswordReset",
      "AdminLoginAudit",
      "admins",
    ] as const) {
      const [matches] = await connection.query("SHOW TABLES LIKE ?", [table]);
      if (Array.isArray(matches) && matches.length > 0) {
        const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
        database[table] = rows;
      } else {
        database[table] = { tableDidNotExist: true };
      }
    }

    const directory = path.join(process.cwd(), "backups");
    await mkdir(directory, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(directory, `events-ticker-pre-migration-${stamp}.json`);
    await writeFile(file, JSON.stringify(snapshot, null, 2), "utf8");
    console.log(`Pre-migration backup saved to ${file}. No database rows were changed.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
