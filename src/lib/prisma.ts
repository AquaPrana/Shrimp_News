import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

if (typeof window !== "undefined") {
  throw new Error("The Prisma client can only be used on the server.");
}

const globalForPrisma = globalThis as typeof globalThis & {
  shrimpNewsPrisma?: PrismaClient;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

function integerEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: requiredEnv("DATABASE_HOST"),
    port: integerEnv("DATABASE_PORT", 3306, 1, 65_535),
    user: requiredEnv("DATABASE_USER"),
    password: requiredEnv("DATABASE_PASSWORD"),
    database: requiredEnv("DATABASE_NAME"),
    connectionLimit: integerEnv("DATABASE_CONNECTION_LIMIT", 3, 1, 20),
    connectTimeout: integerEnv("DATABASE_CONNECT_TIMEOUT_MS", 10_000, 1_000, 60_000),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  if (!globalForPrisma.shrimpNewsPrisma) {
    globalForPrisma.shrimpNewsPrisma = createPrismaClient();
  }
  return globalForPrisma.shrimpNewsPrisma;
}

/** Lazy proxy so importing this module during build does not require DB env vars. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

function redact(value: string | undefined) {
  if (!value) return value;
  const secrets = [
    process.env.DATABASE_URL,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    process.env.ADMIN_PASSWORD_HASH,
    process.env.ADMIN_SESSION_SECRET,
    process.env.AUTH_SECRET,
  ].filter((secret): secret is string => Boolean(secret));
  return secrets.reduce((text, secret) => text.replaceAll(secret, "[REDACTED]"), value);
}

export function logDatabaseError(context: string, error: unknown) {
  const value = error && typeof error === "object"
    ? error as { name?: unknown; message?: unknown; stack?: unknown; code?: unknown }
    : {};
  console.error(`[database:${context}]`, {
    name: redact(typeof value.name === "string" ? value.name : "UnknownError"),
    message: redact(typeof value.message === "string" ? value.message : String(error)),
    stack: redact(typeof value.stack === "string" ? value.stack : undefined),
    code: typeof value.code === "string" ? value.code : undefined,
  });
}

export function prismaErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}
