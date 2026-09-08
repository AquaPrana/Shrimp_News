import { notFound } from "next/navigation";
import { ArticleDetailView } from "@/components/articles/article-detail-view";
import { BudgetToPondFeatureArticle } from "@/components/articles/budget-to-pond-feature-article";
import {
  baseSlug,
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
  const normalizedSlug = baseSlug(slug);
  const isBudgetToPond = normalizedSlug === "from-budget-to-pond";

  const article = await getPublishedArticleBySlug(normalizedSlug);
  if (!article) notFound();

  if (isBudgetToPond) {
    const related = await getRelatedPublishedArticles(article, 3);

    return (
      <ArticleDetailView
        slug={normalizedSlug}
        initialArticle={article}
        initialRelated={related}
        customBody={<BudgetToPondFeatureArticle />}
        hideDefaultHeader
      />
    );
  }

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
