import "server-only";

import { randomBytes } from "node:crypto";

export function createUnsubscribeToken() {
  return randomBytes(32).toString("hex");
}

export function isValidUnsubscribeToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}
