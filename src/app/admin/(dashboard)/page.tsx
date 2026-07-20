import Link from "next/link";
import { demoStore } from "@/lib/demo-admin-store";

export const dynamic = "force-dynamic";

export default function Overview() {
  const published = demoStore.articles.filter((article) => article.status === "published");
  const drafts = demoStore.articles.filter((article) => article.status === "draft");
  const activeSubscribers = demoStore.subscribers.filter((subscriber) => subscriber.status === "active");
  const recentArticles = [...published].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")).slice(0, 5);
  const recentSubscribers = [...demoStore.subscribers].sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt)).slice(0, 5);
  const cards = [["Total articles", demoStore.articles.length], ["Published", published.length], ["Drafts", drafts.length], ["Active subscribers", activeSubscribers.length]];

  return <div className="space-y-8">
    <header><p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Dashboard</p><h1 className="mt-2 text-3xl font-extrabold text-slate-900">Overview</h1><p className="mt-2 text-slate-600">A current snapshot of publishing and newsletter activity.</p></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-[#0B3A6E]">{value}</p></div>)}</section>
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Recently published" href="/admin/articles">{recentArticles.map((article) => <div key={article.id} className="py-3"><p className="font-semibold">{article.title}</p><p className="text-xs text-slate-500">{article.language.toUpperCase()} · {article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "—"}</p></div>)}</Panel>
      <Panel title="Recent subscribers" href="/admin/subscribers">{recentSubscribers.map((subscriber) => <div key={subscriber.id} className="py-3"><p className="font-semibold">{subscriber.name || subscriber.email}</p><p className="text-xs text-slate-500">{subscriber.email} · {subscriber.language?.toUpperCase()}</p></div>)}</Panel>
    </div>
  </div>;
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><h2 className="text-lg font-bold">{title}</h2><Link href={href} className="text-sm font-semibold text-cyan-700">View all</Link></div><div className="mt-4 divide-y divide-slate-100">{children}</div></section>;
}
