import { NextResponse } from "next/server";
import { ARTICLE_CATEGORIES } from "@/lib/article-types";
import { normalizeArticlePagination } from "@/lib/article-pagination";
import { logDatabaseError } from "@/lib/prisma";
import { queryPublishedArticles } from "@/lib/public-articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const topic = url.searchParams.get("topic");
    const q = url.searchParams.get("q");
    const featured = url.searchParams.get("featured") ?? url.searchParams.get("isFeatured");
    const popular = url.searchParams.get("popular") ?? url.searchParams.get("isPopular");
    const pagination = normalizeArticlePagination({
      limit: Number(url.searchParams.get("limit") || 60),
      page: Number(url.searchParams.get("page") || 1),
    });
    const { limit, page } = pagination;

    if (category && !ARTICLE_CATEGORIES.includes(category as never)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    if (featured !== null && featured !== "true" && featured !== "false") {
      return NextResponse.json({ error: "Featured filter must be true or false." }, { status: 400 });
    }
    if (popular !== null && popular !== "true" && popular !== "false") {
      return NextResponse.json({ error: "Popular filter must be true or false." }, { status: 400 });
    }

    // Returns all stored language fields; clients select via getLocalizedArticle.
    const articles = await queryPublishedArticles({
      topic,
      category,
      q,
      limit,
      page,
      ...(featured === null ? {} : { isFeatured: featured === "true" }),
      ...(popular === null ? {} : { isPopular: popular === "true" }),
    });

    return NextResponse.json({ articles, page, limit });
  } catch (error) {
    logDatabaseError("public-articles.list", error);
    // Never expose database details to clients.
    return NextResponse.json(
      { error: "Unable to load articles." },
      { status: 500 },
    );
  }
}
