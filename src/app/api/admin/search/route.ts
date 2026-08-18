import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { verifyAdminApi } from "@/lib/admin-auth";
import { normalizeAdminSearchQuery, type AdminSearchResult } from "@/lib/admin-search";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULT_LIMIT = 6;

export async function GET(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const query = normalizeAdminSearchQuery(new URL(request.url).searchParams.get("q") || "");
  if (!query) {
    return NextResponse.json({ success: true, results: [] });
  }

  const articleWhere: Prisma.ArticleWhereInput = {
    OR: [
      { title: { contains: query } },
      { slug: { contains: query } },
      { category: { contains: query } },
      { mainCategory: { contains: query } },
    ],
  };
  const eventWhere: Prisma.EventWhereInput = {
    OR: [
      { title: { contains: query } },
      { slug: { contains: query } },
      { category: { contains: query } },
      { region: { contains: query } },
      { venue: { contains: query } },
    ],
  };
  const tickerWhere: Prisma.TickerItemWhereInput = {
    OR: [
      { label: { contains: query } },
      { value: { contains: query } },
      { description: { contains: query } },
      { type: { contains: query } },
      { couponCode: { contains: query } },
      { species: { contains: query } },
      { location: { contains: query } },
      { company: { contains: query } },
      { product: { contains: query } },
    ],
  };

  try {
    const [articles, events, tickers, subscribers] = await Promise.all([
      prisma.article.findMany({
        where: articleWhere,
        orderBy: { updatedAt: "desc" },
        take: RESULT_LIMIT,
        select: { id: true, title: true, category: true, isPublished: true },
      }),
      prisma.event.findMany({
        where: eventWhere,
        orderBy: { updatedAt: "desc" },
        take: RESULT_LIMIT,
        select: { id: true, title: true, category: true, status: true },
      }),
      prisma.tickerItem.findMany({
        where: tickerWhere,
        orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
        take: RESULT_LIMIT,
        select: { id: true, label: true, type: true, isActive: true },
      }),
      prisma.subscriber.findMany({
        where: { email: { contains: query } },
        orderBy: { updatedAt: "desc" },
        take: RESULT_LIMIT,
        select: { id: true, email: true, isActive: true },
      }),
    ]);

    const results: AdminSearchResult[] = [
      ...articles.map((article) => ({
        id: article.id,
        type: "article" as const,
        title: article.title,
        subtitle: `Article • ${article.category} • ${article.isPublished ? "Published" : "Draft"}`,
        href: `/admin/articles/${article.id}/edit`,
      })),
      ...events.map((event) => ({
        id: event.id,
        type: "event" as const,
        title: event.title,
        subtitle: `Event • ${event.category} • ${event.status}`,
        href: `/admin/events/${event.id}/edit`,
      })),
      ...tickers.map((ticker) => ({
        id: ticker.id,
        type: "ticker" as const,
        title: ticker.label,
        subtitle: `Ticker Item • ${ticker.type.replaceAll("_", " ")} • ${ticker.isActive ? "Active" : "Inactive"}`,
        href: "/admin/ticker",
      })),
      ...subscribers.map((subscriber) => ({
        id: subscriber.id,
        type: "subscriber" as const,
        title: subscriber.email,
        subtitle: `Subscriber • ${subscriber.isActive ? "Active" : "Inactive"}`,
        href: "/admin/subscribers",
      })),
    ];

    return NextResponse.json({ success: true, results });
  } catch (error) {
    logDatabaseError("admin.search", error);
    return NextResponse.json(
      { success: false, message: "Unable to search the CMS right now." },
      { status: 500 },
    );
  }
}
