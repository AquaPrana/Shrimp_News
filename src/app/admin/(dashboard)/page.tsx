import Link from "next/link";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Overview() {
  let articles: Awaited<ReturnType<typeof prisma.article.findMany>> = [];
  let subscribers: Awaited<ReturnType<typeof prisma.subscriber.findMany>> = [];

  try {
    [articles, subscribers] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
  } catch (error) {
    logDatabaseError("admin.overview", error);
  }

  const published = articles.filter((article) => article.isPublished);
  const drafts = articles.filter((article) => !article.isPublished);
  const recentArticles = published.slice(0, 5);
  const recentSubscribers = subscribers.slice(0, 5);
  const cards = [
    ["Total articles", articles.length],
    ["Published", published.length],
    ["Drafts", drafts.length],
    ["Active subscribers", subscribers.length],
  ] as const;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Overview</h1>
        <p className="mt-2 text-slate-600">
          A current snapshot of publishing and newsletter activity.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-[#0B3A6E]">{value}</p>
          </div>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recently published" href="/admin/articles">
          {recentArticles.length ? (
            recentArticles.map((article) => (
              <div key={article.id} className="py-3">
                <p className="font-semibold">{article.title}</p>
                <p className="text-xs text-slate-500">
                  {article.language.toUpperCase()} ·{" "}
                  {new Date(article.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="py-3 text-sm text-slate-500">No published articles yet.</p>
          )}
        </Panel>
        <Panel title="Recent subscribers" href="/admin/subscribers">
          {recentSubscribers.length ? (
            recentSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="py-3">
                <p className="font-semibold">{subscriber.email}</p>
                <p className="text-xs text-slate-500">
                  {new Date(subscriber.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="py-3 text-sm text-slate-500">No subscribers yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-cyan-700">
          View all
        </Link>
      </div>
      <div className="mt-4 divide-y divide-slate-100">{children}</div>
    </section>
  );
}
