import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ARTICLE_CATEGORIES, ARTICLE_LANGUAGES, type ArticleLanguage } from "@/lib/article-types";
import { logDatabaseError, prisma } from "@/lib/prisma";
import { mapPublicArticle, TOPIC_CATEGORIES } from "@/lib/public-articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const language = (url.searchParams.get("language") || "en") as ArticleLanguage;
    const category = url.searchParams.get("category");
    const topic = url.searchParams.get("topic");
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 60), 1), 100);
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);

    if (!ARTICLE_LANGUAGES.includes(language)) {
      return NextResponse.json({ error: "Invalid language." }, { status: 400 });
    }

    const where: Prisma.ArticleWhereInput = { isPublished: true, language };
    if (topic && TOPIC_CATEGORIES[topic]) {
      where.category = { in: TOPIC_CATEGORIES[topic] };
    } else if (category && ARTICLE_CATEGORIES.includes(category as never)) {
      where.category = category;
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ articles: articles.map(mapPublicArticle), page, limit });
  } catch (error) {
    logDatabaseError("public-articles.list", error);
    return NextResponse.json({ error: "Unable to load articles." }, { status: 500 });
  }
}
