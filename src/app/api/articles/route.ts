import { NextResponse } from "next/server";
import { ARTICLE_CATEGORIES, ARTICLE_LANGUAGES, type ArticleLanguage } from "@/lib/article-types";
import { logDatabaseError } from "@/lib/prisma";
import { queryPublishedArticles } from "@/lib/public-articles";

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

    if (category && !ARTICLE_CATEGORIES.includes(category as never)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const articles = await queryPublishedArticles({
      language,
      topic,
      category,
      limit,
      page,
    });

    return NextResponse.json({ articles, page, limit });
  } catch (error) {
    logDatabaseError("public-articles.list", error);
    return NextResponse.json({ error: "Unable to load articles." }, { status: 500 });
  }
}
