import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "shrimp_admin_session";
export type AdminSession = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor";
};

export type AdminCredentials = {
  admin: AdminSession;
  passwordHash: string;
};

export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const missing = [
    !email ? "ADMIN_EMAIL" : null,
    !passwordHash ? "ADMIN_PASSWORD_HASH" : null,
  ].filter((name): name is string => Boolean(name));

  if (!email || !passwordHash) {
    console.error(`[admin-auth] Missing required environment variable(s): ${missing.join(", ")}.`);
    return null;
  }

  return {
    admin: {
      id: 1,
      name: process.env.ADMIN_NAME?.trim() || "Shrimp.News Admin",
      email,
      role: "admin",
    },
    passwordHash,
  };
}

const demoSecret = new TextEncoder().encode(
  "shrimp-news-demo-only-session-secret-never-use-in-production",
);

function sessionSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (value) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV !== "production") return demoSecret;
  throw new Error("Admin session secret is not configured.");
}

export async function createAdminToken(admin: AdminSession) {
  return new SignJWT({ name: admin.name, email: admin.email, role: admin.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(admin.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(sessionSecret());
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      sessionSecret(),
      { algorithms: ["HS256"] },
    );
    const credentials = getAdminCredentials();
    const id = Number(payload.sub);
    if (!credentials || !Number.isInteger(id) || payload.email !== credentials.admin.email) return null;
    return { ...credentials.admin, id };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await readAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function verifyAdminApi(request: Request) {
  const admin = await readAdminSession();
  if (!admin) return null;
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return null;
  }
  return admin;
}
