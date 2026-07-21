"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ARTICLE_CATEGORIES,
  LANGUAGE_NAMES,
  type AdminArticle,
  type ArticleCategory,
  type ArticleLanguage,
} from "@/lib/article-types";
import { normalizeArticleImageUrl, slugify } from "@/lib/validation";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: ArticleCategory;
  language: ArticleLanguage;
  isPublished: boolean;
};

const ANDHRA_FEATURED_IMAGE =
  "/images/articles/andrapradesh-aqua-culture.jpeg";

const empty: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  category: "National",
  language: "en",
  isPublished: false,
};

function resolveFormImageUrl(article?: AdminArticle) {
  if (!article) return "";
  const current = article.imageUrl?.trim() || "";
  if (
    article.slug.includes("andhra-pradesh-seeks") &&
    (!current || current.includes("ArticleImage.jpeg"))
  ) {
    return ANDHRA_FEATURED_IMAGE;
  }
  return current;
}

function toFormState(article?: AdminArticle): FormState {
  if (!article) return empty;
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content,
    imageUrl: resolveFormImageUrl(article),
    category: article.category,
    language: article.language,
    isPublished: article.isPublished,
  };
}

export function ArticleForm({ article }: { article?: AdminArticle }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(article));
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    setForm(toFormState(article));
    setSlugEdited(Boolean(article));
    setPreviewBroken(false);
    setImageError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid wiping in-progress edits
  }, [article?.id, article?.imageUrl, article?.updatedAt]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateImageField(value: string) {
    const normalized = normalizeArticleImageUrl(value);
    if (!normalized.ok) {
      setImageError(normalized.error);
      return normalized;
    }
    setImageError("");
    return normalized;
  }

  function updateImageUrl(value: string) {
    setPreviewBroken(false);
    setField("imageUrl", value);
    if (!value.trim()) {
      setImageError("");
      return;
    }
    // Clear format errors once the value becomes valid; full checks run on blur/submit.
    const normalized = normalizeArticleImageUrl(value);
    if (normalized.ok) setImageError("");
  }

  function updateTitle(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugEdited ? current.slug : slugify(value),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);

    const image = validateImageField(form.imageUrl);
    if (!image.ok) {
      setIsError(true);
      setMessage(image.error);
      setBusy(false);
      return;
    }

    if (image.value && previewBroken) {
      const loadError =
        "Featured image could not be loaded. Check the URL or local path and try again.";
      setImageError(loadError);
      setIsError(true);
      setMessage(loadError);
      setBusy(false);
      return;
    }

    try {
      const payload = {
        ...form,
        imageUrl: image.value || "",
      };
      const response = await fetch(
        article ? `/api/admin/articles/${article.id}` : "/api/admin/articles",
        {
          method: article ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(body.error || "Unable to save the article.");
        if (typeof body.error === "string" && /image/i.test(body.error)) {
          setImageError(body.error);
        }
        return;
      }

      const savedUrl =
        typeof body.article?.imageUrl === "string" ? body.article.imageUrl : "";
      setField("imageUrl", savedUrl);
      setMessage(body.message || "Article saved successfully.");
      router.push("/admin/articles");
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("Unable to save the article right now.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const trimmedImageUrl = form.imageUrl.trim();
  const formatOk = !trimmedImageUrl || normalizeArticleImageUrl(trimmedImageUrl).ok;
  const showImagePreview = Boolean(trimmedImageUrl) && formatOk && !previewBroken;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          Content
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          {article ? "Edit article" : "Add article"}
        </h1>
        <p className="mt-2 text-slate-600">
          Draft, preview, and publish a complete story.
        </p>
      </header>
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      ) : null}
      <form
        onSubmit={submit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <Field label="Article title">
            <input
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              required
              maxLength={255}
              className={input}
            />
          </Field>
          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                setField("slug", slugify(event.target.value));
              }}
              required
              maxLength={255}
              className={input}
            />
            <Hint>Generated from the title and editable. Slugs must be unique.</Hint>
          </Field>
          <Field label="Short description">
            <textarea
              value={form.excerpt}
              onChange={(event) => setField("excerpt", event.target.value)}
              rows={3}
              maxLength={2000}
              className={`${input} h-auto py-3`}
            />
          </Field>
          <Field label="Complete article content">
            <textarea
              value={form.content}
              onChange={(event) => setField("content", event.target.value)}
              required
              rows={18}
              className={`${input} h-auto whitespace-pre-wrap py-3 font-mono text-sm`}
            />
            <Hint>
              Plain text is stored safely. Separate paragraphs with blank lines.
            </Hint>
          </Field>
        </section>
        <aside className="space-y-5">
          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <Field label="Featured image URL">
              <input
                type="text"
                inputMode="url"
                value={form.imageUrl}
                onChange={(event) => updateImageUrl(event.target.value)}
                onBlur={() => {
                  if (form.imageUrl.trim()) validateImageField(form.imageUrl);
                }}
                placeholder="/images/articles/example.jpeg"
                className={`${input}${imageError || previewBroken ? " border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                aria-invalid={Boolean(imageError || previewBroken)}
              />
              <Hint>
                Use a local path (`/images/articles/…`) or a full HTTPS CDN /
                Hostinger URL. Preview updates immediately.
              </Hint>
            </Field>
            {imageError || previewBroken ? (
              <p role="alert" className="text-sm text-red-600">
                {imageError ||
                  "Featured image could not be loaded. Check the URL or local path and try again."}
              </p>
            ) : null}
            {showImagePreview ? (
              <img
                key={trimmedImageUrl}
                src={trimmedImageUrl}
                alt="Featured image preview"
                className="aspect-video w-full rounded-xl object-cover"
                onLoad={() => {
                  setPreviewBroken(false);
                  if (!imageError) setImageError("");
                }}
                onError={() => {
                  setPreviewBroken(true);
                  setImageError(
                    "Featured image could not be loaded. Check the URL or local path and try again.",
                  );
                }}
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl bg-slate-100 px-4 text-center text-sm text-slate-500">
                {trimmedImageUrl
                  ? "Waiting for a valid, loadable image…"
                  : "Image preview"}
              </div>
            )}
          </section>
          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) =>
                  setField("category", event.target.value as ArticleCategory)
                }
                className={input}
              >
                {ARTICLE_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Language">
              <select
                value={form.language}
                onChange={(event) =>
                  setField("language", event.target.value as ArticleLanguage)
                }
                className={input}
              >
                {article ? (
                  Object.entries(LANGUAGE_NAMES).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))
                ) : (
                  <option value="en">English</option>
                )}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.isPublished ? "published" : "draft"}
                onChange={(event) =>
                  setField("isPublished", event.target.value === "published")
                }
                className={input}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreview(true)}
                className="h-11 rounded-xl border font-bold"
              >
                Preview
              </button>
              <button
                disabled={busy}
                className="h-11 rounded-xl bg-[#0B4F7A] font-bold text-white disabled:opacity-50"
              >
                {busy
                  ? "Saving…"
                  : form.isPublished
                    ? "Publish"
                    : "Save draft"}
              </button>
            </div>
          </section>
        </aside>
      </form>
      {preview ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-4 sm:p-8">
          <article className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
            <div className="flex justify-end">
              <button
                onClick={() => setPreview(false)}
                className="rounded-lg border px-3 py-1 text-sm font-bold"
              >
                Close preview
              </button>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-600">
              {form.category}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-[#0B3A6E] sm:text-5xl">
              {form.title || "Untitled article"}
            </h1>
            <p className="mt-4 text-lg text-slate-600">{form.excerpt}</p>
            {showImagePreview ? (
              <img
                key={`modal-${trimmedImageUrl}`}
                src={trimmedImageUrl}
                alt=""
                className="mt-7 aspect-video w-full rounded-2xl object-cover"
              />
            ) : null}
            <div className="mt-8 space-y-5 leading-8">
              {form.content.split(/\n\n+/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span className="block">{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-xs font-normal text-slate-500">
      {children}
    </span>
  );
}
