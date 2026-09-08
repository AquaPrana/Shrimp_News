import { publicArticleWhere } from "@/lib/article-publication";
import { validateArticlePublication } from "@/lib/article-publication";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { verifyAdminApi } from "@/lib/admin-auth";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";
import { validatePrismaArticleInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const status = url.searchParams.get("status")?.trim();
    const date = url.searchParams.get("date")?.trim();
    const where: Prisma.ArticleWhereInput = {};

    if (category) where.category = category;
    if (status === "published") where.AND = [publicArticleWhere()];
    if (status === "draft") { where.isPublished = false; where.scheduledAt = null; }
    if (status === "scheduled") where.scheduledAt = { gt: new Date() };
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    const rows = await prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    const articles = q
      ? rows.filter((article) => article.title.toLowerCase().includes(q.toLowerCase()))
      : rows;
    return NextResponse.json({ articles });
  } catch (error) {
    logDatabaseError("articles.list", error);
    return NextResponse.json({ error: "Failed to load articles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const validated = validatePrismaArticleInput(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const duplicate = await prisma.article.findUnique({
      where: { slug: validated.value.slug },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "An article with this slug already exists." }, { status: 409 });
    }

    const publication = validateArticlePublication(body);
    if (!publication.ok) return NextResponse.json({ error: publication.error }, { status: 400 });

    const article = await prisma.article.create({
      data: { ...validated.value, ...publication.value },
    });

    return NextResponse.json(
      {
        message: publication.value.scheduledAt && !publication.value.isPublished
          ? "Article scheduled successfully."
          : publication.value.isPublished
          ? "Article published successfully."
          : "Draft saved successfully.",
        article,
      },
      { status: 201 },
    );
  } catch (error) {
    logDatabaseError("articles.create", error);
    if (prismaErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "An article with this slug already exists." }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create article." }, { status: 500 });
  }
}
