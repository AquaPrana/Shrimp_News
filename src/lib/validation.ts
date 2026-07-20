import { ARTICLE_CATEGORIES, ARTICLE_LANGUAGES, ARTICLE_STATUSES, type ArticleCategory, type ArticleLanguage, type ArticleStatus } from "@/lib/article-types";
export function slugify(value: string) { return value.normalize("NFKD").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 255); }
export function sanitizePlainText(value: unknown, max: number) { return typeof value === "string" ? value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/\r\n/g, "\n").trim().slice(0, max) : ""; }
export function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 190; }
export type ArticleInput = { title:string;slug:string;excerpt:string;content:string;featuredImageUrl:string|null;featuredImageAlt:string;category:ArticleCategory;language:ArticleLanguage;author:string;status:ArticleStatus;seoTitle:string;seoDescription:string;sourceUrl:string|null;publishedAt:string|null };
export function validateArticleInput(raw: Record<string, unknown>) {
 const value: ArticleInput={title:sanitizePlainText(raw.title,255),slug:slugify(String(raw.slug||raw.title||"")),excerpt:sanitizePlainText(raw.excerpt,2000),content:sanitizePlainText(raw.content,500_000),featuredImageUrl:null,featuredImageAlt:sanitizePlainText(raw.featuredImageAlt,255),category:raw.category as ArticleCategory,language:raw.language as ArticleLanguage,author:sanitizePlainText(raw.author,120),status:raw.status as ArticleStatus,seoTitle:sanitizePlainText(raw.seoTitle,255),seoDescription:sanitizePlainText(raw.seoDescription,1000),sourceUrl:null,publishedAt:null};
 for(const key of ["featuredImageUrl","sourceUrl"] as const){const input=raw[key];if(typeof input==="string"&&input.trim()){const cleaned=input.trim();if(key==="featuredImageUrl"&&cleaned.startsWith("/")&&!cleaned.startsWith("//")&&!cleaned.includes("..")){value[key]=cleaned;continue}try{const u=new URL(cleaned);if(!["http:","https:"].includes(u.protocol))throw new Error();value[key]=u.toString();}catch{return{ok:false as const,error:`${key==="sourceUrl"?"Source":"Image"} URL must be a valid HTTP or HTTPS URL.`}}}}
 if(typeof raw.publishedAt==="string"&&raw.publishedAt){const date=new Date(raw.publishedAt);if(Number.isNaN(date.getTime()))return{ok:false as const,error:"Publish date is invalid."};value.publishedAt=date.toISOString().slice(0,19).replace("T"," ");}
 if(value.title.length<5)return{ok:false as const,error:"Title must be at least 5 characters."};if(!value.slug)return{ok:false as const,error:"A valid slug is required."};if(value.excerpt.length<20)return{ok:false as const,error:"Excerpt must be at least 20 characters."};if(value.content.length<50)return{ok:false as const,error:"Article content must be at least 50 characters."};if(!ARTICLE_CATEGORIES.includes(value.category))return{ok:false as const,error:"Choose a valid category."};if(!ARTICLE_LANGUAGES.includes(value.language))return{ok:false as const,error:"Choose a valid language."};if(!ARTICLE_STATUSES.includes(value.status))return{ok:false as const,error:"Choose a valid status."};if(!value.author)return{ok:false as const,error:"Author is required."};if(!value.seoTitle)value.seoTitle=value.title;if(!value.seoDescription)value.seoDescription=value.excerpt;
 return{ok:true as const,value};
}

export type PrismaArticleInput = {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  category: ArticleCategory;
  language: ArticleLanguage;
  isPublished: boolean;
};

export function validatePrismaArticleInput(raw: Record<string, unknown>) {
  const title = sanitizePlainText(raw.title, 255);
  const slug = slugify(String(raw.slug || title));
  const content = sanitizePlainText(raw.content, 500_000);
  const excerpt = sanitizePlainText(raw.excerpt, 2_000) || null;
  const category = sanitizePlainText(raw.category, 120) as ArticleCategory;
  const language = sanitizePlainText(raw.language, 20) as ArticleLanguage;

  if (!title) return { ok: false as const, error: "Title is required." };
  if (!slug) return { ok: false as const, error: "A valid slug is required." };
  if (!content) return { ok: false as const, error: "Content is required." };
  if (!category) return { ok: false as const, error: "Category is required." };
  if (!language) return { ok: false as const, error: "Language is required." };
  if (!ARTICLE_CATEGORIES.includes(category)) return { ok: false as const, error: "Choose a valid category." };
  if (!ARTICLE_LANGUAGES.includes(language)) return { ok: false as const, error: "Choose a valid language." };
  if (raw.isPublished !== undefined && typeof raw.isPublished !== "boolean") {
    return { ok: false as const, error: "Published status must be true or false." };
  }

  let imageUrl: string | null = null;
  if (typeof raw.imageUrl === "string" && raw.imageUrl.trim()) {
    const candidate = raw.imageUrl.trim();
    if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("..")) {
      imageUrl = candidate;
    } else {
      try {
        const url = new URL(candidate);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Unsupported URL protocol");
        imageUrl = url.toString();
      } catch {
        return { ok: false as const, error: "Image URL must be a valid HTTP or HTTPS URL." };
      }
    }
  }

  const value: PrismaArticleInput = {
    title,
    slug,
    content,
    excerpt,
    imageUrl,
    category,
    language,
    isPublished: raw.isPublished === true,
  };
  return { ok: true as const, value };
}
