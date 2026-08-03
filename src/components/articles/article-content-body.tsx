import {
  prepareArticleContentForDisplay,
} from "@/lib/article-content";

type ArticleContentBodyProps = {
  content: string;
  className?: string;
  /**
   * @deprecated Ignored. All articles now use the same article-prose styles.
   * Kept optional so older call sites keep compiling.
   */
  compactLegacySpacing?: boolean;
};

/**
 * Single reusable article-body renderer for every published article.
 * Sanitizes imported HTML and applies the shared `.article-prose` typography.
 */
export function ArticleContentBody({
  content,
  className = "",
}: ArticleContentBodyProps) {
  const html = prepareArticleContentForDisplay(content);
  if (!html) return null;

  return (
    <div
      className={`article-prose article-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
