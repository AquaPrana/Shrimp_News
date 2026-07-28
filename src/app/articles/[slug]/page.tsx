import { notFound } from "next/navigation";
import { ArticleDetailView } from "@/components/articles/article-detail-view";
import { BudgetToPondFeatureArticle } from "@/components/articles/budget-to-pond-feature-article";
import type { PublicArticle } from "@/lib/article-types";
import {
  baseSlug,
  getPublishedArticles,
  getPublishedArticleBySlug,
  getRelatedPublishedArticles,
} from "@/lib/public-articles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function createBudgetToPondFallbackArticle(): PublicArticle {
  const now = new Date().toISOString();

  return {
    id: "custom-from-budget-to-pond",
    title:
      "From Budget to Pond — Can India Track Its 2026 Aquaculture Promises to the Farmer?",
    slug: "from-budget-to-pond",
    excerpt:
      "India’s major 2026 aquaculture commitments are tested against a five-stage public-delivery standard, from Budget announcement to measurable benefit at the pond.",
    content: "",
    featuredImageUrl: "/images/articles/budget-to-pond.jpeg",
    featuredImageAlt: "From Budget to Pond – Aquaculture Analysis",
    mainCategory: "india",
    category: "Research & Innovations",
    language: "en",
    author: "Shrimp News Editorial",
    status: "published",
    seoTitle:
      "From Budget to Pond — Can India Track Its 2026 Aquaculture Promises to the Farmer? | Shrimp News",
    seoDescription:
      "India’s major 2026 aquaculture commitments are tested against a five-stage public-delivery standard, from Budget announcement to measurable benefit at the pond.",
    sourceUrl: "/articles/from-budget-to-pond",
    topics: ["national", "research"],
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    titleEn:
      "From Budget to Pond — Can India Track Its 2026 Aquaculture Promises to the Farmer?",
    summaryEn:
      "India’s major 2026 aquaculture commitments are tested against a five-stage public-delivery standard, from Budget announcement to measurable benefit at the pond.",
    contentEn: "",
    titleTe: "",
    summaryTe: "",
    contentTe: "",
    titleHi: "",
    summaryHi: "",
    contentHi: "",
    translationAvailable: {
      en: true,
      te: false,
      hi: false,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = baseSlug(slug);
  const isBudgetToPond = normalizedSlug === "from-budget-to-pond";

  let article = await getPublishedArticleBySlug(normalizedSlug);

  if (isBudgetToPond) {
    article ??= createBudgetToPondFallbackArticle();
    const related =
      article.id === "custom-from-budget-to-pond"
        ? await getPublishedArticles({ category: article.category, limit: 3 })
        : await getRelatedPublishedArticles(article, 3);

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
