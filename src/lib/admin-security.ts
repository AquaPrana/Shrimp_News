import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetToken() {
  return randomBytes(32).toString("base64url");
}

export async function deliverPasswordReset(email: string, resetUrl: string) {
  const endpoint = process.env.ADMIN_PASSWORD_RESET_WEBHOOK_URL?.trim();
  const secret = process.env.ADMIN_PASSWORD_RESET_WEBHOOK_SECRET?.trim();
  if (!endpoint) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[admin-password-reset:development]", { email, resetUrl });
    } else {
      console.error("[admin-password-reset] Delivery webhook is not configured.");
    }
    return false;
  }

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("Reset webhook must use HTTPS.");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({
        template: "admin-password-reset",
        to: email,
        resetUrl,
        expiresInMinutes: 30,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Reset delivery failed (${response.status}).`);
    return true;
  } catch (error) {
    console.error("[admin-password-reset:delivery]", {
      message: error instanceof Error ? error.message : "Unknown delivery error",
    });
    return false;
  }
}
