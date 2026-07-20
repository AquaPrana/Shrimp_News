import "server-only";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

const globalForMysql = globalThis as typeof globalThis & { shrimpNewsMysqlPool?: Pool };

export function isMysqlIntegrationEnabled() {
  return process.env.MYSQL_INTEGRATION_ENABLED === "true";
}
function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

export function getMysqlPool() {
  if (!isMysqlIntegrationEnabled()) {
    throw new Error("MySQL integration is temporarily disabled.");
  }
  if (globalForMysql.shrimpNewsMysqlPool) return globalForMysql.shrimpNewsMysqlPool;
  const pool = mysql.createPool({
    host: required("MYSQL_HOST"), port: Number(process.env.MYSQL_PORT || 3306),
    database: required("MYSQL_DATABASE"), user: required("MYSQL_USER"), password: required("MYSQL_PASSWORD"),
    waitForConnections: true, connectionLimit: 10, maxIdle: 10, idleTimeout: 60_000,
    queueLimit: 0, enableKeepAlive: true, keepAliveInitialDelay: 0, charset: "utf8mb4", timezone: "Z",
    ssl: process.env.MYSQL_SSL === "false" ? undefined : { rejectUnauthorized: true },
  });
  globalForMysql.shrimpNewsMysqlPool = pool;
  return pool;
}

export async function selectRows<T extends RowDataPacket>(sql: string, values: unknown[] = []) {
  const [rows] = await getMysqlPool().execute<T[]>(sql, values as never[]);
  return rows;
}
export async function execute(sql: string, values: unknown[] = []) {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, values as never[]);
  return result;
}
