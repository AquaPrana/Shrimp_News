import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  FileEdit,
  FilePlus2,
  FileText,
  Users,
} from "lucide-react";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Overview() {
  let totalArticles = 0;
  let publishedArticles = 0;
  let draftArticles = 0;
  let eventCount = 0;
  let subscriberCount = 0;
  let recentArticles: Array<{
    id: string;
    title: string;
    category: string;
    isPublished: boolean;
    updatedAt: Date;
  }> = [];

  const results = await Promise.allSettled([
    prisma.article.count(),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.article.count({ where: { isPublished: false } }),
    prisma.event.count(),
    prisma.subscriber.count(),
    prisma.article.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        category: true,
        isPublished: true,
        updatedAt: true,
      },
    }),
  ]);

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logDatabaseError(`admin.overview.${index}`, result.reason);
    }
  });

  if (results[0].status === "fulfilled") totalArticles = results[0].value;
  if (results[1].status === "fulfilled") publishedArticles = results[1].value;
  if (results[2].status === "fulfilled") draftArticles = results[2].value;
  if (results[3].status === "fulfilled") eventCount = results[3].value;
  if (results[4].status === "fulfilled") subscriberCount = results[4].value;
  if (results[5].status === "fulfilled") recentArticles = results[5].value;

  const articleCards = [
    {
      label: "Total Articles",
      value: totalArticles,
      detail: "All English articles",
      icon: FileText,
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Published Articles",
      value: publishedArticles,
      detail: `${totalArticles ? Math.round((publishedArticles / totalArticles) * 100) : 0}% of all articles`,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Draft Articles",
      value: draftArticles,
      detail: draftArticles ? "Awaiting publication" : "No drafts pending",
      icon: FileEdit,
      iconClass: "bg-amber-50 text-amber-700",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
            Content Overview
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Articles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review recent stories and manage your publishing workflow.
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white transition hover:bg-cyan-700"
        >
          <FilePlus2 size={18} />
          Add New Article
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {articleCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>
                <card.icon size={19} />
              </span>
              <span className="text-3xl font-black tracking-tight text-slate-950">
                {card.value.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-4 text-sm font-extrabold text-slate-800">
              {card.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Recent Articles
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your most recently updated English articles.
            </p>
          </div>
          <Link
            href="/admin/articles"
            className="text-sm font-bold text-[#0B4F7A] hover:text-cyan-700"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 sm:px-6">Article title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Published date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentArticles.length ? (
                recentArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="max-w-md px-5 py-4 font-bold text-slate-800 sm:px-6">
                      <span className="line-clamp-2">{article.title}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {article.category}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {article.isPublished
                        ? article.updatedAt.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          article.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {article.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#0B4F7A] transition hover:border-cyan-300 hover:bg-cyan-50"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No articles are available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SecondaryCard
          href="/admin/events"
          label="Events"
          value={eventCount}
          detail="Managed events"
          icon={CalendarDays}
        />
        <SecondaryCard
          href="/admin/subscribers"
          label="Subscribers"
          value={subscriberCount}
          detail="Weekly Brief audience"
          icon={Users}
        />
      </section>
    </div>
  );
}

function SecondaryCard({
  href,
  label,
  value,
  detail,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: number;
  detail: string;
  icon: typeof CalendarDays;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0B4F7A]">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-slate-800">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
      </span>
      <span className="text-2xl font-black tabular-nums text-slate-950">
        {value.toLocaleString("en-IN")}
      </span>
    </Link>
  );
}
