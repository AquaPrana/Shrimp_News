import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleDetailView } from "@/components/articles/article-detail-view";
import {
  baseSlug,
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
  languageFromSlug,
} from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = baseSlug(slug);
  const initialLanguage = languageFromSlug(slug);
  const article = await getPublishedArticleBySlug(normalizedSlug, initialLanguage);

  if (!article) {
    notFound();
  }

  const related = await getRelatedPublishedArticles(article, 3);

  return (
    <ArticleDetailView
      slug={normalizedSlug}
      initialArticle={article}
      initialRelated={related}
    />
  );
}
