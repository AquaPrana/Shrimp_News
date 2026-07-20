"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { readingTime, type PublicArticle } from "@/lib/article-types";

export function FeaturedArticle({ article }: { article: PublicArticle }) {
  const { t } = useLanguage();
  return <article className="market-dashboard-card relative grid gap-8 overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#0B4F7A] p-8 shadow-[0_24px_70px_rgba(11,79,122,0.28)] lg:grid-cols-[1.4fr_0.9fr] xl:p-10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_42%)]" />
    <div className="relative z-10 space-y-6"><span className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-xs uppercase tracking-[0.32em] text-orange-300">{article.category}</span><div className="space-y-4"><h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{article.title}</h2><p className="max-w-3xl text-base leading-8 text-cyan-50/85 sm:text-lg">{article.excerpt}</p></div><div className="flex flex-wrap items-center gap-4"><Link href={`/articles/${article.slug}`} className="inline-flex rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.18)] transition hover:bg-orange-400">{t("readFeaturedStory")}</Link><span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-cyan-50/80">{readingTime(article.content)}</span></div></div>
    <div className="relative z-10 overflow-hidden rounded-[28px] border border-white/10 bg-[#03172d]">{article.featuredImageUrl ? <Image src={article.featuredImageUrl} alt={article.featuredImageAlt} width={900} height={700} className="h-full min-h-[280px] w-full object-cover sm:min-h-[320px]" sizes="(max-width: 1024px) 100vw, 40vw" /> : null}</div>
  </article>;
}
