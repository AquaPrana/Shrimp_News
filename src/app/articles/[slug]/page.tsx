import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleGrid } from "@/components/articles/article-grid";
import { PAGE_CONTENT_PANEL_CLASS } from "@/components/layout/page-shell";
import { readingTime } from "@/lib/article-types";
import {
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
} from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedPublishedArticles(article, 3);
  const cover =
    article.featuredImageUrl || "/images/articles/ArticleImage.jpeg";

  return (
    <section className="relative overflow-x-hidden bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.08),transparent_38%)]" />
      <div className="relative z-10 mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-500 sm:text-sm">
            {article.category}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-sky-50 shadow-[0_18px_50px_rgba(11,79,122,0.14)] sm:rounded-[30px]">
            <Image
              src={cover}
              alt={article.featuredImageAlt || article.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover object-center"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[#ff6a3d]">
              Article
            </span>
            <span>{readingTime(article.content)}</span>
          </div>
          {article.excerpt ? (
            <p className="text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {article.excerpt}
            </p>
          ) : null}
        </div>

        <article className={PAGE_CONTENT_PANEL_CLASS}>
          <div className="space-y-5">
            {article.content.split("\n\n").map((paragraph, index) => {
              const isHeading =
                paragraph.length < 90 &&
                !paragraph.endsWith(".") &&
                !paragraph.endsWith("?") &&
                !paragraph.includes("\n");

              if (isHeading) {
                return (
                  <h2
                    key={`${article.slug}-${index}`}
                    className="pt-2 text-xl font-semibold text-[#0B3A6E] sm:text-2xl"
                  >
                    {paragraph}
                  </h2>
                );
              }

              return <p key={`${article.slug}-${index}`}>{paragraph}</p>;
            })}
          </div>
        </article>

        {related.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              Related Articles
            </h2>
            <ArticleGrid articles={related} />
          </div>
        ) : null}

        <div>
          <Link href="/articles" className="font-semibold text-orange-500">
            ← Explore articles
          </Link>
        </div>
      </div>
    </section>
  );
}
