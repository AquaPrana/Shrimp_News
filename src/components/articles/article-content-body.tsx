import { prepareArticleContentForDisplay } from "@/lib/article-content";

type ArticleContentBodyProps = {
  content: string;
  className?: string;
};

export function ArticleContentBody({ content, className = "" }: ArticleContentBodyProps) {
  const html = prepareArticleContentForDisplay(content);
  if (!html) return null;

  return (
    <div
      className={`article-prose space-y-5 ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
