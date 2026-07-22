import Link from "next/link";
import { ArticleCoverImage } from "@/components/articles/article-cover-image";
import type { PublicArticle } from "@/lib/article-types";
import { baseSlug } from "@/lib/public-articles-shared";

function publishedTime(article: PublicArticle) {
  return new Date(article.publishedAt || article.createdAt).getTime();
}

function formatDate(article: PublicArticle) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(article.publishedAt || article.createdAt));
}

export function DomesticFeaturedSection({
  articles,
}: {
  articles: PublicArticle[];
}) {
  const featured = articles
    .filter((article) => article.category === "Domestic Consumption")
    .sort((a, b) => publishedTime(b) - publishedTime(a))
    .slice(0, 3);

  if (!featured.length) return null;

  return (
    <section className="overflow-hidden bg-white px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 flex items-center border-b-2 border-[#0B4F7A]">
          <h2 className="bg-[#0B4F7A] px-5 py-3 text-base font-black uppercase tracking-[0.1em] text-white sm:text-lg">
            Featured
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((article) => (
            <article
              key={`domestic-featured-${article.slug}`}
              className="group min-w-0 overflow-hidden border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              <Link
                href={`/articles/${baseSlug(article.slug)}`}
                className="block"
                aria-label={`Read ${article.title}`}
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <ArticleCoverImage
                    src={article.featuredImageUrl}
                    alt={article.featuredImageAlt || article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B4F7A]">
                    {article.category}
                  </span>
                  <h3 className="mt-2 line-clamp-3 text-lg font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0B4F7A]">
                    {article.title}
                  </h3>
                  <time className="mt-3 block text-xs text-slate-500">
                    {formatDate(article)}
                  </time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
