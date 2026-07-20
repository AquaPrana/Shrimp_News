"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ARTICLE_CATEGORIES, LANGUAGE_NAMES, type AdminArticle, type ArticleCategory, type ArticleLanguage } from "@/lib/article-types";
import { slugify } from "@/lib/validation";

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

export function ArticleForm({ article }: { article?: AdminArticle }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(article ? {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    content: article.content,
    imageUrl: article.imageUrl || "",
    category: article.category,
    language: article.language,
    isPublished: article.isPublished,
  } : empty);
  const [slugEdited, setSlugEdited] = useState(Boolean(article));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [preview, setPreview] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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
    try {
      const response = await fetch(article ? `/api/admin/articles/${article.id}` : "/api/admin/articles", {
        method: article ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(body.error || "Unable to save the article.");
        return;
      }
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

  const input = "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

  return <div className="space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Content</p><h1 className="mt-2 text-3xl font-extrabold">{article ? "Edit article" : "Add article"}</h1><p className="mt-2 text-slate-600">Draft, preview, and publish a complete story.</p></header>
    {message ? <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message}</div> : null}
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <Field label="Article title"><input value={form.title} onChange={(event) => updateTitle(event.target.value)} required maxLength={255} className={input} /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(event) => { setSlugEdited(true); set("slug", slugify(event.target.value)); }} required maxLength={255} className={input} /><Hint>Generated from the title and editable. Slugs must be unique.</Hint></Field>
        <Field label="Short description"><textarea value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} rows={3} maxLength={2000} className={`${input} h-auto py-3`} /></Field>
        <Field label="Complete article content"><textarea value={form.content} onChange={(event) => set("content", event.target.value)} required rows={18} className={`${input} h-auto whitespace-pre-wrap py-3 font-mono text-sm`} /><Hint>Plain text is stored safely. Separate paragraphs with blank lines.</Hint></Field>
      </section>
      <aside className="space-y-5">
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <Field label="Featured image URL"><input type="text" value={form.imageUrl} onChange={(event) => set("imageUrl", event.target.value)} placeholder="https://…" className={input} /><Hint>Use a persistent Hostinger or approved CDN URL.</Hint></Field>
          {form.imageUrl ? <img src={form.imageUrl} alt="Featured image preview" className="aspect-video w-full rounded-xl object-cover" /> : <div className="grid aspect-video place-items-center rounded-xl bg-slate-100 text-sm text-slate-500">Image preview</div>}
        </section>
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <Field label="Category"><select value={form.category} onChange={(event) => set("category", event.target.value as ArticleCategory)} className={input}>{ARTICLE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Language"><select value={form.language} onChange={(event) => set("language", event.target.value as ArticleLanguage)} className={input}>{article ? Object.entries(LANGUAGE_NAMES).map(([value, label]) => <option value={value} key={value}>{label}</option>) : <option value="en">English</option>}</select></Field>
          <Field label="Status"><select value={form.isPublished ? "published" : "draft"} onChange={(event) => set("isPublished", event.target.value === "published")} className={input}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
          <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setPreview(true)} className="h-11 rounded-xl border font-bold">Preview</button><button disabled={busy} className="h-11 rounded-xl bg-[#0B4F7A] font-bold text-white disabled:opacity-50">{busy ? "Saving…" : form.isPublished ? "Publish" : "Save draft"}</button></div>
        </section>
      </aside>
    </form>
    {preview ? <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-4 sm:p-8"><article className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10"><div className="flex justify-end"><button onClick={() => setPreview(false)} className="rounded-lg border px-3 py-1 text-sm font-bold">Close preview</button></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-600">{form.category}</p><h1 className="mt-3 text-3xl font-extrabold text-[#0B3A6E] sm:text-5xl">{form.title || "Untitled article"}</h1><p className="mt-4 text-lg text-slate-600">{form.excerpt}</p>{form.imageUrl ? <img src={form.imageUrl} alt="" className="mt-7 aspect-video w-full rounded-2xl object-cover" /> : null}<div className="mt-8 space-y-5 leading-8">{form.content.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></div> : null}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold">{label}{children}</label>; }
function Hint({ children }: { children: React.ReactNode }) { return <span className="mt-1 block text-xs font-normal text-slate-500">{children}</span>; }
