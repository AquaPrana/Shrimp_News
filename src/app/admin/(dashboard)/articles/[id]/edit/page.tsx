import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/article-form";
import { demoStore } from "@/lib/demo-admin-store";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = demoStore.articles.find((item) => item.id === id);
  if (!article) notFound();
  return <ArticleForm article={article} />;
}
