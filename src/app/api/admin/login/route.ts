import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import {
  ADMIN_COOKIE,
  createAdminToken,
} from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isEmail } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.info("LOGIN_REQUEST_RECEIVED");

  if (!rateLimit(`admin-login:${clientIp(request)}`, 10, 15 * 60_000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  const adminEmailValue = process.env.ADMIN_EMAIL;
  const passwordHashValue = process.env.ADMIN_PASSWORD_HASH;
  const authSecret = process.env.AUTH_SECRET;

  if (!adminEmailValue || !passwordHashValue || !authSecret) {
    console.error("MISSING_ENV");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
  console.info("ADMIN_ENV_AVAILABLE");

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as {
      email?: string;
      password?: string;
    };
  } catch {
    console.warn("INVALID_CREDENTIALS");
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const normalizedEmail = typeof body.email === "string"
    ? body.email.trim().toLowerCase()
    : "";
  const password = typeof body.password === "string" ? body.password : "";
  const adminEmail = adminEmailValue.trim().toLowerCase();
  const passwordHash = passwordHashValue.trim();
  const emailMatches = isEmail(normalizedEmail) && normalizedEmail === adminEmail;
  console.info("EMAIL_MATCH_RESULT", { matches: emailMatches });

  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
    console.error("BCRYPT_ERROR");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  let passwordMatches = false;
  try {
    passwordMatches = Boolean(password) && password.length <= 200
      ? await compare(password, passwordHash)
      : false;
    console.info("PASSWORD_COMPARE_RESULT", { matches: passwordMatches });
  } catch {
    console.error("BCRYPT_ERROR");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (!emailMatches || !passwordMatches) {
    console.warn("INVALID_CREDENTIALS");
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  let sessionToken: string;
  try {
    sessionToken = await createAdminToken({
      id: 1,
      name: process.env.ADMIN_NAME?.trim() || "Shrimp.News Admin",
      email: adminEmail,
      role: "admin",
    });
    console.info("SESSION_CREATED");
  } catch {
    console.error("SESSION_ERROR");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ success: true, redirectTo: "/admin" });
  try {
    response.cookies.set(ADMIN_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    console.info("COOKIE_CREATED");
  } catch {
    console.error("COOKIE_ERROR");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  console.info("LOGIN_SUCCESS");
  return response;
}
