"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Clock3, Edit3, ExternalLink, Plus, Trash2, X } from "lucide-react";
import type { TickerItemType } from "@/lib/market-data/client";

type TickerRow = {
  id: string;
  label: string;
  value: string;
  description: string | null;
  type: TickerItemType;
  species: string | null;
  location: string | null;
  company: string | null;
  product: string | null;
  bagSize: string | null;
  couponCode: string | null;
  expiryDate: string | null;
  campaignName: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  displayOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  price: number;
  unit: string;
  changePercent: number | null;
  updatedAt: string;
};

type FormState = {
  id: string | null;
  type: TickerItemType;
  species: string;
  location: string;
  company: string;
  product: string;
  bagSize: string;
  price: string;
  unit: string;
  priceChange: string;
  title: string;
  description: string;
  couponCode: string;
  websiteUrl: string;
  ctaText: string;
  isActive: boolean;
  displayOrder: string;
  startsAt: string;
  endsAt: string;
};

const TYPES: { value: TickerItemType; label: string }[] = [
  { value: "market", label: "Shrimp Market Price" },
  { value: "feed", label: "Feed Price" },
  { value: "product_launch", label: "Product Launch" },
  { value: "promotion", label: "Promotion" },
  { value: "coupon", label: "Coupon Code" },
  { value: "announcement", label: "Announcement" },
  { value: "external_link", label: "Website Link" },
  { value: "custom_message", label: "Custom Message" },
];

const inputClass = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10";
const textareaClass = `${inputClass} h-24 resize-y py-3`;

function blankForm(displayOrder = 0): FormState {
  return {
    id: null,
    type: "market",
    species: "",
    location: "",
    company: "",
    product: "",
    bagSize: "",
    price: "",
    unit: "kg",
    priceChange: "",
    title: "",
    description: "",
    couponCode: "",
    websiteUrl: "",
    ctaText: "",
    isActive: true,
    displayOrder: String(displayOrder),
    startsAt: "",
    endsAt: "",
  };
}

function typeLabel(type: TickerItemType) {
  return TYPES.find((item) => item.value === type)?.label || "Ticker Item";
}

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function buildTickerParts(form: FormState) {
  const price = form.price ? `₹${form.price}` : "";
  const cta = form.ctaText ? `${form.ctaText} →` : "";
  if (form.type === "market") {
    const change = form.priceChange ? `${Number(form.priceChange) >= 0 ? "▲" : "▼"} ${Math.abs(Number(form.priceChange))}%` : "";
    return { label: form.species, value: [price && `${price}/${form.unit || "kg"}`, change].filter(Boolean).join(" ") };
  }
  if (form.type === "feed") {
    return {
      label: [form.company, form.product].filter(Boolean).join(" "),
      value: [form.bagSize, price && `${price}/${form.unit || "bag"}`].filter(Boolean).join(" · "),
    };
  }
  if (form.type === "coupon") {
    return {
      label: `🎁 ${form.title}`.trim(),
      value: [form.couponCode && `Use code ${form.couponCode}`, form.description, cta].filter(Boolean).join(" • "),
    };
  }
  if (form.type === "announcement") {
    return { label: `📢 ${form.title}`.trim(), value: [form.description, cta].filter(Boolean).join(" • ") };
  }
  return { label: form.title, value: [form.description, cta].filter(Boolean).join(" • ") };
}

function fromRow(row: TickerRow): FormState {
  return {
    ...blankForm(row.displayOrder),
    id: row.id,
    type: row.type,
    species: row.species || (row.type === "market" ? row.label : ""),
    location: row.location || "",
    company: row.company || "",
    product: row.product || "",
    bagSize: row.bagSize || "",
    price: row.price ? String(row.price) : "",
    unit: row.unit || "kg",
    priceChange: row.changePercent == null ? "" : String(row.changePercent),
    title: ["market", "feed"].includes(row.type) ? "" : row.label.replace(/^(🎁|📢)\s*/, ""),
    description: row.description || "",
    couponCode: row.couponCode || "",
    websiteUrl: row.linkUrl || "",
    ctaText: row.linkLabel || "",
    isActive: row.isActive,
    startsAt: toLocalInput(row.startsAt),
    endsAt: toLocalInput(row.endsAt),
  };
}

function payload(form: FormState) {
  const content = buildTickerParts(form);
  return {
    label: content.label,
    value: content.value || content.label,
    description: form.description,
    type: form.type,
    species: form.species,
    location: form.location,
    company: form.company,
    product: form.product,
    bagSize: form.bagSize,
    price: Number(form.price || 0),
    unit: form.unit,
    priceChange: form.priceChange === "" ? null : Number(form.priceChange),
    couponCode: form.couponCode,
    campaignName: form.title || form.company || form.product || form.species || content.label,
    linkUrl: form.websiteUrl,
    linkLabel: form.ctaText,
    imageUrl: "",
    expiryDate: "",
    startsAt: toIso(form.startsAt),
    endsAt: toIso(form.endsAt),
    isActive: form.isActive,
    displayOrder: Number(form.displayOrder || 0),
  };
}

export function TickerManager() {
  const [items, setItems] = useState<TickerRow[]>([]);
  const [form, setForm] = useState<FormState>(() => blankForm());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const savingRef = useRef(false);
  const preview = useMemo(() => {
    const parts = buildTickerParts(form);
    return [parts.label, parts.value].filter(Boolean).join(" — ") || "Your ticker preview will appear here";
  }, [form]);

  const notify = useCallback((text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/admin/ticker", { cache: "no-store", credentials: "same-origin" });
      const body = await response.json() as { success?: boolean; items?: unknown; lastUpdated?: unknown; message?: unknown };
      if (!response.ok || body.success !== true) throw new Error(typeof body.message === "string" ? body.message : `Unable to load ticker items (${response.status}).`);
      if (!Array.isArray(body.items)) throw new Error("The ticker API returned an invalid response.");
      setItems(body.items as TickerRow[]);
      setLastUpdated(typeof body.lastUpdated === "string" ? body.lastUpdated : "");
    } catch (error) {
      console.error("Ticker manager load failed.", error);
      setLoadError(true);
      notify("Ticker items could not be loaded. Please refresh or try again.", true);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { void load(); }, [load]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setBusy("save");
    try {
      const response = await fetch(form.id ? `/api/admin/ticker/${form.id}` : "/api/admin/ticker", {
        method: form.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload(form)),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to save ticker item.");
      setOpen(false);
      setForm(blankForm());
      notify(form.id ? "Ticker item updated." : "Ticker item added.");
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to save ticker item.", true);
    } finally {
      savingRef.current = false;
      setBusy("");
    }
  }

  async function updateItem(item: TickerRow, changes: Partial<TickerRow>, success: string) {
    setBusy(item.id);
    try {
      const response = await fetch(`/api/admin/ticker/${item.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...item, priceChange: item.changePercent, ...changes }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to update ticker item.");
      notify(success);
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to update ticker item.", true);
    } finally {
      setBusy("");
    }
  }

  async function remove(item: TickerRow) {
    if (!window.confirm(`Delete “${item.label}”? This cannot be undone.`)) return;
    setBusy(item.id);
    try {
      const response = await fetch(`/api/admin/ticker/${item.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to delete ticker item.");
      notify("Ticker item deleted.");
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to delete ticker item.", true);
    } finally {
      setBusy("");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((item, displayOrder) => ({ ...item, displayOrder }));
    setItems(reordered);
    const response = await fetch("/api/admin/ticker/reorder", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: reordered.map(({ id, displayOrder }) => ({ id, displayOrder })) }),
    });
    if (!response.ok) {
      notify("Order could not be saved.", true);
      await load();
    } else {
      notify("Ticker order updated.");
    }
  }

  async function updateTimestamp() {
    setBusy("timestamp");
    try {
      const response = await fetch("/api/admin/ticker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "updateLastUpdated", lastUpdated: new Date().toISOString() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to update timestamp.");
      setLastUpdated(body.lastUpdated);
      notify("Ticker timestamp updated.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to update timestamp.", true);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-600">Content management</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Price Ticker</h2><p className="mt-2 text-sm text-slate-500">Manage the information displayed in the scrolling ticker on Shrimp.News.</p></div>
        <button onClick={() => { setForm(blankForm(items.length)); setOpen(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#083d60]"><Plus size={17} /> Add Ticker Item</button>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Ticker Content</th><th className="px-4 py-4">Type</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Order</th><th className="px-4 py-4">Link</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <EmptyRow label="Loading ticker items…" muted /> : loadError ? <EmptyRow label="Ticker items could not be loaded. Please refresh or try again." error /> : items.length === 0 ? <EmptyRow label="No ticker items yet" /> : items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="max-w-xl px-5 py-4 font-semibold text-slate-800">{item.label} <span className="text-slate-600">{item.value}</span></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-[#0B4F7A]">{typeLabel(item.type)}</span></td>
                  <td className="px-4 py-4"><button disabled={busy === item.id} onClick={() => void updateItem(item, { isActive: !item.isActive }, item.isActive ? "Ticker item deactivated." : "Ticker item activated.")} aria-label={`${item.isActive ? "Deactivate" : "Activate"} ${item.label}`} className={`relative h-6 w-11 rounded-full transition ${item.isActive ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${item.isActive ? "left-6" : "left-1"}`} /></button><span className="ml-2 text-xs font-semibold text-slate-600">{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-4"><span className="text-xs font-bold text-slate-600">{item.displayOrder}</span><div className="mt-1 flex gap-1"><button disabled={index === 0} onClick={() => void move(index, -1)} aria-label="Move up" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowUp size={15} /></button><button disabled={index === items.length - 1} onClick={() => void move(index, 1)} aria-label="Move down" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowDown size={15} /></button></div></td>
                  <td className="px-4 py-4">{item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:underline">Open Link <ExternalLink size={12} /></a> : <span className="text-slate-400">—</span>}</td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => { setForm(fromRow(item)); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#0B4F7A] hover:bg-cyan-50"><Edit3 size={14} /> Edit</button><button onClick={() => void remove(item)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-[#0B4F7A]"><Clock3 size={19} /></span><p className="text-sm text-slate-500">Last Updated: <span className="font-bold text-slate-800">{lastUpdated ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(lastUpdated)) : "Not set"}</span></p></div><button disabled={Boolean(busy)} onClick={() => void updateTimestamp()} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#0B4F7A] hover:bg-slate-50 disabled:opacity-50">{busy === "timestamp" ? "Updating…" : "Update Timestamp"}</button></section>

      {open ? <TickerForm form={form} preview={preview} busy={busy === "save"} setField={setField} onClose={() => setOpen(false)} onSubmit={save} /> : null}
      {toast ? <div role="status" className={`fixed bottom-5 right-5 z-[110] flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-2xl ${toast.error ? "bg-red-600" : "bg-slate-900"}`}>{toast.error ? <X size={17} /> : <Check size={17} />}{toast.text}</div> : null}
    </div>
  );
}

function EmptyRow({ label, muted = false, error = false }: { label: string; muted?: boolean; error?: boolean }) {
  return <tr><td colSpan={6} className={`px-5 py-16 text-center font-bold ${error ? "text-red-700" : muted ? "text-slate-400" : "text-slate-700"}`}>{label}</td></tr>;
}

type TickerFieldProps = {
  form: FormState;
  label: string;
  name: keyof FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  step?: string;
};

function TickerField({ form, label, name, setField, placeholder, type = "text", required = false, step }: TickerFieldProps) {
  return <label className="block text-sm font-bold text-slate-700">{label}{required ? " *" : ""}<input type={type} step={step} required={required} value={String(form[name])} onChange={(event) => setField(name, event.target.value as never)} placeholder={placeholder} className={inputClass} /></label>;
}

function TickerForm({ form, preview, busy, setField, onClose, onSubmit }: { form: FormState; preview: string; busy: boolean; setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) {
  const promotional = form.type === "product_launch" || form.type === "promotion";
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" aria-labelledby="ticker-form-title" className="max-h-[96vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><form onSubmit={onSubmit}>
    <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7"><div><h2 id="ticker-form-title" className="text-xl font-black text-slate-950">{form.id ? "Edit Ticker Item" : "Add Ticker Item"}</h2><p className="mt-1 text-sm text-slate-500">Only the fields needed for this ticker are shown.</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
    <div className="space-y-6 px-5 py-6 sm:px-7">
      <label className="block text-sm font-bold text-slate-700">Ticker Type *<div className="relative"><select value={form.type} onChange={(event) => setField("type", event.target.value as TickerItemType)} className={`${inputClass} appearance-none pr-10`}>{TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-5 text-slate-400" size={17} /></div></label>
      <div className="grid gap-5 sm:grid-cols-2">
        {form.type === "market" ? <><TickerField form={form} setField={setField} label="Shrimp Species / Grade" name="species" required placeholder="Vannamei C30" /><TickerField form={form} setField={setField} label="Price" name="price" type="number" step="0.01" required placeholder="445" /><TickerField form={form} setField={setField} label="Unit" name="unit" required placeholder="kg" /><TickerField form={form} setField={setField} label="Price Change %" name="priceChange" type="number" step="0.01" placeholder="2.1" /><TickerField form={form} setField={setField} label="Location" name="location" placeholder="Andhra Pradesh" /></> : null}
        {form.type === "feed" ? <><TickerField form={form} setField={setField} label="Feed Company" name="company" required placeholder="Feed company" /><TickerField form={form} setField={setField} label="Feed Product" name="product" required placeholder="Grower feed" /><TickerField form={form} setField={setField} label="Bag Size" name="bagSize" placeholder="25kg" /><TickerField form={form} setField={setField} label="Price" name="price" type="number" step="0.01" required placeholder="2125" /><TickerField form={form} setField={setField} label="Unit" name="unit" placeholder="bag" /></> : null}
        {promotional ? <><TickerField form={form} setField={setField} label="Product / Promotion Title" name="title" required placeholder="New product or promotion" /><TickerField form={form} setField={setField} label="Website URL" name="websiteUrl" type="url" placeholder="https://…" /><TickerField form={form} setField={setField} label="CTA Text" name="ctaText" placeholder="Explore" /><TickerField form={form} setField={setField} label="Optional Coupon Code" name="couponCode" placeholder="SAVE20" /></> : null}
        {form.type === "coupon" ? <><TickerField form={form} setField={setField} label="Offer Title" name="title" required placeholder="Launch Offer" /><TickerField form={form} setField={setField} label="Coupon Code" name="couponCode" required placeholder="SAVE20" /><TickerField form={form} setField={setField} label="Website URL" name="websiteUrl" type="url" placeholder="https://…" /><TickerField form={form} setField={setField} label="CTA Text" name="ctaText" placeholder="Get Started" /></> : null}
        {form.type === "announcement" ? <><TickerField form={form} setField={setField} label="Announcement Title" name="title" required placeholder="We are officially launched" /><TickerField form={form} setField={setField} label="Optional Website URL" name="websiteUrl" type="url" placeholder="https://…" /><TickerField form={form} setField={setField} label="Optional CTA Text" name="ctaText" placeholder="Discover More" /></> : null}
        {form.type === "external_link" ? <><TickerField form={form} setField={setField} label="Link Title" name="title" required placeholder="Visit our website" /><TickerField form={form} setField={setField} label="Website URL" name="websiteUrl" type="url" required placeholder="https://…" /><TickerField form={form} setField={setField} label="CTA Text" name="ctaText" placeholder="Visit Website" /></> : null}
        {form.type === "custom_message" ? <><TickerField form={form} setField={setField} label="Title / Message" name="title" required placeholder="Important update" /><TickerField form={form} setField={setField} label="Optional URL" name="websiteUrl" type="url" placeholder="https://…" /><TickerField form={form} setField={setField} label="Optional CTA Text" name="ctaText" placeholder="Read More" /></> : null}
      </div>
      <label className="block text-sm font-bold text-slate-700">Short Description<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Add a short, human-readable detail (optional)" className={textareaClass} /></label>
      <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2"><TickerField form={form} setField={setField} label="Display Order" name="displayOrder" type="number" required /><TickerField form={form} setField={setField} label="Start Date / Time" name="startsAt" type="datetime-local" /><TickerField form={form} setField={setField} label="End Date / Time" name="endsAt" type="datetime-local" /><label className="flex h-11 items-center justify-between self-end rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700"><span>Active</span><input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} className="h-4 w-4 accent-emerald-500" /></label></div>
      <div className="rounded-2xl bg-gradient-to-r from-[#083d60] to-[#087f8c] p-5 text-white"><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">Live Preview</p><p className="mt-3 text-sm font-bold leading-6">{preview}</p>{form.websiteUrl ? <p className="mt-2 text-[11px] text-cyan-100">This ticker will open its link safely in a new tab.</p> : null}</div>
    </div>
    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7"><button type="button" disabled={busy} onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700">Cancel</button><button type="submit" disabled={busy} className="h-11 rounded-xl bg-[#0B4F7A] px-6 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving…" : form.id ? "Save Changes" : "Add Ticker Item"}</button></div>
  </form></div></div>;
}
