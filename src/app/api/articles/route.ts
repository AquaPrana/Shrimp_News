import { NextResponse } from "next/server";
import { ARTICLE_CATEGORIES } from "@/lib/article-types";
import { logDatabaseError } from "@/lib/prisma";
import { queryPublishedArticles } from "@/lib/public-articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const topic = url.searchParams.get("topic");
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") || 60), 1),
      100,
    );
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);

    if (category && !ARTICLE_CATEGORIES.includes(category as never)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    // Returns all stored language fields; clients select via getLocalizedArticle.
    const articles = await queryPublishedArticles({
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
