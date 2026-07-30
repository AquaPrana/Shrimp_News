import { HomePage } from "@/components/homepage/home-page";
import { getPublishedArticles } from "@/lib/public-articles";
import { getPublishedEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // All language fields are returned; client selects via LanguageProvider.
  const [articles, events] = await Promise.all([
    getPublishedArticles({ limit: 60 }),
    getPublishedEvents(),
  ]);
  return <HomePage initialArticles={articles} initialEvents={events} />;
}
