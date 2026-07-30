import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { validatePassword } from "../src/lib/password-policy";

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function required(name: string, value?: string) {
  if (!value?.trim()) throw new Error(`Missing ${name}.`);
  return value.trim();
}

const email = required("--email", arg("email")).toLowerCase();
const name = arg("name")?.trim() || "Shrimp.News Admin";
const plainPassword = required(
  "--password or ADMIN_BOOTSTRAP_PASSWORD",
  arg("password") || process.env.ADMIN_BOOTSTRAP_PASSWORD,
);
const policyError = validatePassword(plainPassword);
if (policyError) throw new Error(policyError);

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: required("DATABASE_HOST", process.env.DATABASE_HOST),
    port: Number(process.env.DATABASE_PORT || 3306),
    database: required("DATABASE_NAME", process.env.DATABASE_NAME),
    user: required("DATABASE_USER", process.env.DATABASE_USER),
    password: required("DATABASE_PASSWORD", process.env.DATABASE_PASSWORD),
  }),
});

try {
  const password = await hash(plainPassword, 12);
  await prisma.admin.upsert({
    where: { email },
    create: {
      name,
      email,
      password,
      role: "super_admin",
      isActive: true,
    },
    update: {
      name,
      password,
      role: "super_admin",
      isActive: true,
    },
  });
  console.log(`Super Admin ${email} is ready.`);
} finally {
  await prisma.$disconnect();
}
