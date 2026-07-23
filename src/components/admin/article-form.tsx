"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LANGUAGE_NAMES,
  resolveArticleTaxonomy,
  subcategoriesForMain,
  type AdminArticle,
  type ArticleCategory,
  type ArticleLanguage,
  type ArticleMainCategory,
} from "@/lib/article-types";
import { editorHtmlToPlainText } from "@/lib/article-content";
import { normalizeArticleImageUrl, slugify } from "@/lib/validation";
import { ArticleContentBody } from "@/components/articles/article-content-body";
import { ArticleContentEditor } from "@/components/admin/article-content-editor";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  mainCategory: ArticleMainCategory;
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
  mainCategory: "India",
  category: "Shrimp Farming",
  language: "en",
  isPublished: false,
};

type UploadStatus = "idle" | "uploading" | "success" | "error";

const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
  const taxonomy = resolveArticleTaxonomy({
    mainCategory: article.mainCategory,
    category: article.category,
  });
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content,
    imageUrl: resolveFormImageUrl(article),
    mainCategory: taxonomy.mainCategory,
    category: taxonomy.category,
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
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

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

  function clearLocalPreview() {
    setLocalPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function removeImage() {
    if (!window.confirm("Remove the featured image from this article?")) {
      return;
    }
    updateImageUrl("");
    clearLocalPreview();
    setUploadStatus("idle");
    setUploadMessage("");
    setPreviewBroken(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadFeaturedImage(file: File) {
    if (uploadInFlightRef.current) return;

    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_UPLOAD_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );

    if (!ALLOWED_UPLOAD_TYPES.has(file.type) || !hasAllowedExtension) {
      setUploadStatus("error");
      setUploadMessage("Only JPG, JPEG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadStatus("error");
      setUploadMessage("Image must be 5 MB or smaller.");
      return;
    }

    clearLocalPreview();
    setLocalPreviewUrl(URL.createObjectURL(file));
    uploadInFlightRef.current = true;
    setUploadStatus("uploading");
    setUploadMessage("Uploading...");
    setPreviewBroken(false);
    setImageError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      let body: { error?: string; url?: string };
      try {
        body = await response.json() as { error?: string; url?: string };
      } catch {
        setUploadStatus("error");
        setUploadMessage("The upload server returned an invalid response.");
        return;
      }
      if (!response.ok) {
        setUploadStatus("error");
        setUploadMessage(
          body.error || "The image upload server is unavailable. Please try again.",
        );
        return;
      }

      if (typeof body.url !== "string" || !/^https:\/\//i.test(body.url)) {
        setUploadStatus("error");
        setUploadMessage("The upload server returned an invalid image URL.");
        return;
      }

      updateImageUrl(body.url);
      setUploadStatus("success");
      setUploadMessage("Upload successful.");
      clearLocalPreview();
    } catch {
      setUploadStatus("error");
      setUploadMessage(
        "The image upload server is unavailable. Check your connection and try again.",
      );
    } finally {
      uploadInFlightRef.current = false;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFeaturedImage(file);
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
    if (isUploading) {
      setIsError(true);
      setMessage("Please wait for the image upload to finish.");
      return;
    }
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

    const contentForSave =
      form.content.trim() || !article ? form.content : article.content;
    const excerptForSave =
      form.excerpt.trim() || !article?.excerpt ? form.excerpt : article.excerpt;

    if (editorHtmlToPlainText(contentForSave).length < 50) {
      setIsError(true);
      setMessage("Article content must be at least 50 characters.");
      setBusy(false);
      return;
    }

    try {
      const payload = {
        ...form,
        content: contentForSave,
        excerpt: excerptForSave,
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
  const previewSrc = localPreviewUrl || (showImagePreview ? trimmedImageUrl : "");
  const hasPreview = Boolean(previewSrc);
  const isUploading = uploadStatus === "uploading";
  const publishDisabled = busy || isUploading;

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
            <ArticleContentEditor
              value={form.content}
              onChange={(html) => setField("content", html)}
            />
          </Field>
        </section>
        <aside className="space-y-5">
          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <Field label="Featured image">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || busy}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-[#0B4F7A] disabled:opacity-50"
                >
                  {isUploading
                    ? "Uploading..."
                    : hasPreview
                      ? "Replace image"
                      : "Upload image"}
                </button>
                {hasPreview ? (
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isUploading || busy}
                    className="h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <Hint>JPG, JPEG, PNG, or WebP up to 5 MB.</Hint>
              {uploadMessage ? (
                <p
                  role="status"
                  aria-live="polite"
                  className={`text-sm ${
                    uploadStatus === "error"
                      ? "text-red-600"
                      : uploadStatus === "success"
                        ? "text-emerald-600"
                        : "text-slate-600"
                  }`}
                >
                  {uploadMessage}
                </p>
              ) : null}
            </Field>
            {imageError || previewBroken ? (
              <p role="alert" className="text-sm text-red-600">
                {imageError ||
                  "Featured image could not be loaded. Check the URL or local path and try again."}
              </p>
            ) : null}
            {hasPreview ? (
              <img
                key={previewSrc}
                src={previewSrc}
                alt="Featured image preview"
                className="aspect-video w-full rounded-xl object-cover"
                onLoad={() => {
                  if (!localPreviewUrl) {
                    setPreviewBroken(false);
                    if (!imageError) setImageError("");
                  }
                }}
                onError={() => {
                  if (!localPreviewUrl) {
                    setPreviewBroken(true);
                    setImageError(
                      "Featured image could not be loaded. Check the URL or local path and try again.",
                    );
                  }
                }}
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl bg-slate-100 px-4 text-center text-sm text-slate-500">
                Image preview
              </div>
            )}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowUrlInput((current) => !current)}
                className="text-sm font-semibold text-cyan-700"
              >
                {showUrlInput ? "Hide image URL" : "Use image URL instead"}
              </button>
              {showUrlInput ? (
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
                    Optional fallback. Use a local path (`/images/articles/…`) or a
                    full HTTPS CDN / Hostinger URL.
                  </Hint>
                </Field>
              ) : null}
            </div>
          </section>
          <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
            <Field label="Main news category">
              <select
                value={form.mainCategory}
                onChange={(event) => {
                  const mainCategory = event.target
                    .value as ArticleMainCategory;
                  const options = subcategoriesForMain(mainCategory);
                  setForm((current) => ({
                    ...current,
                    mainCategory,
                    category: options.includes(current.category)
                      ? current.category
                      : options[0],
                  }));
                }}
                className={input}
              >
                <option value="India">India</option>
                <option value="Global">Global</option>
              </select>
            </Field>
            <Field label="Subcategory">
              <select
                value={form.category}
                onChange={(event) =>
                  setField("category", event.target.value as ArticleCategory)
                }
                className={input}
              >
                {subcategoriesForMain(form.mainCategory).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
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
                disabled={publishDisabled}
                className="h-11 rounded-xl bg-[#0B4F7A] font-bold text-white disabled:opacity-50"
              >
                {isUploading
                  ? "Uploading..."
                  : busy
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
              {form.mainCategory} · {form.category}
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
            <div className="mt-8">
              <ArticleContentBody content={form.content} />
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
