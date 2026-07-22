import {
  ARTICLE_CATEGORIES,
  ARTICLE_LANGUAGES,
  ARTICLE_STATUSES,
  isValidMainCategory,
  isValidSubcategory,
  resolveArticleTaxonomy,
  type ArticleCategory,
  type ArticleLanguage,
  type ArticleMainCategory,
  type ArticleStatus,
} from "@/lib/article-types";
import { prepareArticleContentForSave } from "@/lib/article-content";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

export function sanitizePlainText(value: unknown, max: number) {
  return typeof value === "string"
    ? value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\r\n/g, "\n")
        .trim()
        .slice(0, max)
    : "";
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 190;
}

const LOCAL_IMAGE_PATH =
  /^\/(?:images|uploads)\/[A-Za-z0-9._\-\/]+\.(?:jpe?g|png|webp|gif|avif)$/i;
const IMAGE_EXTENSION = /\.(?:jpe?g|png|webp|gif|avif)(?:\?.*)?$/i;

/**
 * Accepts:
 * - local public paths: `/images/articles/example.jpeg`
 * - absolute CDN/Hostinger URLs: `https://…`
 */
export function normalizeArticleImageUrl(raw: unknown):
  | { ok: true; value: string | null }
  | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, error: "Image URL must be a string." };
  }

  const candidate = raw.trim();
  if (!candidate) return { ok: true, value: null };

  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    if (candidate.includes("..") || candidate.includes("\\") || candidate.includes("//")) {
      return {
        ok: false,
        error: "Local image path is invalid. Use a path like /images/articles/example.jpeg.",
      };
    }
    if (!LOCAL_IMAGE_PATH.test(candidate) && !IMAGE_EXTENSION.test(candidate)) {
      return {
        ok: false,
        error:
          "Local image path must point to an image file under /images/… (jpeg, jpg, png, webp, gif, or avif).",
      };
    }
    // Prefer the stricter /images|/uploads pattern when extension matches but folder differs.
    if (!candidate.startsWith("/images/") && !candidate.startsWith("/uploads/")) {
      return {
        ok: false,
        error:
          "Local image path must start with /images/ or /uploads/ (for example /images/articles/example.jpeg).",
      };
    }
    return { ok: true, value: candidate };
  }

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        ok: false,
        error: "Image URL must use HTTP or HTTPS.",
      };
    }
    if (!url.hostname) {
      return { ok: false, error: "Image URL is missing a hostname." };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return {
      ok: false,
      error:
        "Image URL must be a local path like /images/articles/example.jpeg or a valid HTTP/HTTPS CDN URL.",
    };
  }
}

export function isRemoteArticleImageUrl(src: string | null | undefined) {
  return Boolean(src && /^https?:\/\//i.test(src));
}

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  category: ArticleCategory;
  language: ArticleLanguage;
  author: string;
  status: ArticleStatus;
  seoTitle: string;
  seoDescription: string;
  sourceUrl: string | null;
  publishedAt: string | null;
};

export function validateArticleInput(raw: Record<string, unknown>) {
  const value: ArticleInput = {
    title: sanitizePlainText(raw.title, 255),
    slug: slugify(String(raw.slug || raw.title || "")),
    excerpt: sanitizePlainText(raw.excerpt, 2000),
    content: sanitizePlainText(raw.content, 500_000),
    featuredImageUrl: null,
    featuredImageAlt: sanitizePlainText(raw.featuredImageAlt, 255),
    category: raw.category as ArticleCategory,
    language: raw.language as ArticleLanguage,
    author: sanitizePlainText(raw.author, 120),
    status: raw.status as ArticleStatus,
    seoTitle: sanitizePlainText(raw.seoTitle, 255),
    seoDescription: sanitizePlainText(raw.seoDescription, 1000),
    sourceUrl: null,
    publishedAt: null,
  };

  for (const key of ["featuredImageUrl", "sourceUrl"] as const) {
    const input = raw[key];
    if (typeof input !== "string" || !input.trim()) continue;
    if (key === "featuredImageUrl") {
      const normalized = normalizeArticleImageUrl(input);
      if (!normalized.ok) return normalized;
      value.featuredImageUrl = normalized.value;
      continue;
    }
    try {
      const u = new URL(input.trim());
      if (!["http:", "https:"].includes(u.protocol)) throw new Error();
      value.sourceUrl = u.toString();
    } catch {
      return { ok: false as const, error: "Source URL must be a valid HTTP or HTTPS URL." };
    }
  }

  if (typeof raw.publishedAt === "string" && raw.publishedAt) {
    const date = new Date(raw.publishedAt);
    if (Number.isNaN(date.getTime())) {
      return { ok: false as const, error: "Publish date is invalid." };
    }
    value.publishedAt = date.toISOString().slice(0, 19).replace("T", " ");
  }

  if (value.title.length < 5) {
    return { ok: false as const, error: "Title must be at least 5 characters." };
  }
  if (!value.slug) return { ok: false as const, error: "A valid slug is required." };
  if (value.excerpt.length < 20) {
    return { ok: false as const, error: "Excerpt must be at least 20 characters." };
  }
  if (value.content.length < 50) {
    return { ok: false as const, error: "Article content must be at least 50 characters." };
  }
  if (!ARTICLE_CATEGORIES.includes(value.category)) {
    return { ok: false as const, error: "Choose a valid category." };
  }
  if (!ARTICLE_LANGUAGES.includes(value.language)) {
    return { ok: false as const, error: "Choose a valid language." };
  }
  if (!ARTICLE_STATUSES.includes(value.status)) {
    return { ok: false as const, error: "Choose a valid status." };
  }
  if (!value.author) return { ok: false as const, error: "Author is required." };
  if (!value.seoTitle) value.seoTitle = value.title;
  if (!value.seoDescription) value.seoDescription = value.excerpt;
  return { ok: true as const, value };
}

export type PrismaArticleInput = {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  mainCategory: ArticleMainCategory;
  category: ArticleCategory;
  language: ArticleLanguage;
  isPublished: boolean;
};

export function validatePrismaArticleInput(raw: Record<string, unknown>) {
  const title = sanitizePlainText(raw.title, 255);
  const slug = slugify(String(raw.slug || title));
  const excerpt = sanitizePlainText(raw.excerpt, 2_000) || null;
  const language = sanitizePlainText(raw.language, 20) as ArticleLanguage;
  const contentResult = prepareArticleContentForSave(raw.content);

  if (!title) return { ok: false as const, error: "Title is required." };
  if (!slug) return { ok: false as const, error: "A valid slug is required." };
  if (!contentResult.ok) return contentResult;
  if (!language) return { ok: false as const, error: "Language is required." };
  if (!ARTICLE_LANGUAGES.includes(language)) {
    return { ok: false as const, error: "Choose a valid language." };
  }
  if (raw.isPublished !== undefined && typeof raw.isPublished !== "boolean") {
    return { ok: false as const, error: "Published status must be true or false." };
  }

  const taxonomy = resolveArticleTaxonomy({
    mainCategory:
      typeof raw.mainCategory === "string" ? raw.mainCategory : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
  });

  if (!isValidMainCategory(taxonomy.mainCategory)) {
    return { ok: false as const, error: "Choose India or Global as the main category." };
  }
  if (!isValidSubcategory(taxonomy.category, taxonomy.mainCategory)) {
    return {
      ok: false as const,
      error:
        taxonomy.mainCategory === "Global" && taxonomy.category === "Domestic Consumption"
          ? "Domestic Consumption is only available for India articles."
          : "Choose a valid subcategory.",
    };
  }

  const image = normalizeArticleImageUrl(raw.imageUrl);
  if (!image.ok) return image;

  const value: PrismaArticleInput = {
    title,
    slug,
    content: contentResult.value,
    excerpt,
    imageUrl: image.value,
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
    language,
    isPublished: raw.isPublished === true,
  };
  return { ok: true as const, value };
}
