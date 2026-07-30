"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import type { TickerItemType } from "@/lib/market-data/client";

type TickerRow = {
  id: string;
  label: string;
  value: string;
  description: string | null;
  type: TickerItemType;
  linkUrl: string | null;
  linkLabel: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id: string | null;
  label: string;
  value: string;
  description: string;
  type: TickerItemType;
  linkUrl: string;
  linkLabel: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: string;
  startsAt: string;
  endsAt: string;
};

type ApiBody = {
  success?: boolean;
  message?: string;
  items?: TickerRow[];
  item?: TickerRow;
  lastUpdated?: string;
  url?: string;
  error?: string;
};

const TYPE_LABELS: Record<TickerItemType, string> = {
  market: "Market Price",
  announcement: "Announcement",
  update: "Website Update",
  promotion: "Promotion",
};

function emptyForm(displayOrder = 0): FormState {
  return {
    id: null,
    label: "",
    value: "",
    description: "",
    type: "market",
    linkUrl: "",
    linkLabel: "",
    imageUrl: "",
    isActive: true,
    displayOrder: String(displayOrder),
    startsAt: "",
    endsAt: "",
  };
}

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function fromRow(item: TickerRow): FormState {
  return {
    id: item.id,
    label: item.label,
    value: item.value,
    description: item.description || "",
    type: item.type,
    linkUrl: item.linkUrl || "",
    linkLabel: item.linkLabel || "",
    imageUrl: item.imageUrl || "",
    isActive: item.isActive,
    displayOrder: String(item.displayOrder),
    startsAt: toLocalInput(item.startsAt),
    endsAt: toLocalInput(item.endsAt),
  };
}

function itemPayload(item: FormState | TickerRow) {
  return {
    label: item.label,
    value: item.value,
    description: item.description || "",
    type: item.type,
    linkUrl: item.linkUrl || "",
    linkLabel: item.linkLabel || "",
    imageUrl: item.imageUrl || "",
    isActive: item.isActive,
    displayOrder: Number(item.displayOrder || 0),
    startsAt: typeof item.startsAt === "string" && item.startsAt
      ? item.startsAt.includes("T") && item.startsAt.length === 16
        ? toIso(item.startsAt)
        : item.startsAt
      : "",
    endsAt: typeof item.endsAt === "string" && item.endsAt
      ? item.endsAt.includes("T") && item.endsAt.length === 16
        ? toIso(item.endsAt)
        : item.endsAt
      : "",
  };
}

export function TickerManager() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<TickerRow[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [formOpen, setFormOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [savedLastUpdated, setSavedLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const showMessage = useCallback((text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  }, []);

  const load = useCallback(async (clearMessage = true) => {
    setLoading(true);
    if (clearMessage) {
      setMessage("");
      setIsError(false);
    }
    try {
      const response = await fetch("/api/admin/ticker", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to load ticker items.");
      }
      setItems(body.items || []);
      const localDate = toLocalInput(body.lastUpdated || null);
      setLastUpdated(localDate);
      setSavedLastUpdated(body.lastUpdated || "");
    } catch (error) {
      console.error("Ticker manager load failed.", error);
      showMessage("Ticker items could not be loaded. Please refresh or try again.", true);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openAdd() {
    setForm(emptyForm(items.length));
    setAdvancedOpen(false);
    setFormOpen(true);
  }

  function openEdit(item: TickerRow) {
    setForm(fromRow(item));
    setAdvancedOpen(Boolean(
      item.linkUrl || item.linkLabel || item.imageUrl || item.startsAt || item.endsAt,
    ));
    setFormOpen(true);
  }

  function closeForm() {
    if (busy === "form" || busy === "upload") return;
    setFormOpen(false);
    setForm(emptyForm(items.length));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("form");
    showMessage("");
    try {
      const response = await fetch(
        form.id ? `/api/admin/ticker/${form.id}` : "/api/admin/ticker",
        {
          method: form.id ? "PUT" : "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(itemPayload(form)),
        },
      );
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to save ticker item.");
      }
      setFormOpen(false);
      showMessage(body.message || "Ticker item saved successfully.");
      await load(false);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to save ticker item.",
        true,
      );
    } finally {
      setBusy("");
    }
  }

  async function toggleActive(item: TickerRow) {
    setBusy(`toggle-${item.id}`);
    showMessage("");
    try {
      const response = await fetch(`/api/admin/ticker/${item.id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...itemPayload(item), isActive: !item.isActive }),
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to update ticker item.");
      }
      showMessage(
        `“${item.label}” ${item.isActive ? "disabled" : "enabled"} successfully.`,
      );
      await load(false);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to update ticker item.",
        true,
      );
    } finally {
      setBusy("");
    }
  }

  async function remove(item: TickerRow) {
    if (!window.confirm("Are you sure you want to delete this ticker item?")) return;
    setBusy(`delete-${item.id}`);
    showMessage("");
    try {
      const response = await fetch(`/api/admin/ticker/${item.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to delete ticker item.");
      }
      showMessage(body.message || "Ticker item deleted successfully.");
      await load(false);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to delete ticker item.",
        true,
      );
    } finally {
      setBusy("");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, displayOrder) => ({ ...item, displayOrder }));
    });
  }

  async function saveOrder() {
    setBusy("order");
    showMessage("");
    try {
      const response = await fetch("/api/admin/ticker/reorder", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ id, displayOrder }) => ({ id, displayOrder })),
        }),
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to save ticker order.");
      }
      showMessage(body.message || "Ticker order saved successfully.");
      await load(false);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to save ticker order.",
        true,
      );
    } finally {
      setBusy("");
    }
  }

  async function saveLastUpdated() {
    setBusy("meta");
    showMessage("");
    try {
      const response = await fetch("/api/admin/ticker", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "updateLastUpdated",
          lastUpdated: toIso(lastUpdated),
        }),
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Unable to save Ticker Last Updated.");
      }
      if (body.lastUpdated) {
        setLastUpdated(toLocalInput(body.lastUpdated));
        setSavedLastUpdated(body.lastUpdated);
      }
      showMessage(body.message || "Ticker Last Updated saved successfully.");
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to save Ticker Last Updated.",
        true,
      );
    } finally {
      setBusy("");
    }
  }

  async function uploadImage(file: File) {
    setBusy("upload");
    showMessage("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        credentials: "same-origin",
        body: data,
      });
      const body = await response.json() as ApiBody;
      if (!response.ok || !body.url) {
        throw new Error(body.message || body.error || "Image upload failed.");
      }
      setField("imageUrl", body.url);
      showMessage("Image uploaded successfully.");
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Image upload failed.",
        true,
      );
    } finally {
      setBusy("");
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  const input = "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const helper = "mt-1.5 block text-xs font-normal leading-5 text-slate-500";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          Markets
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Price Ticker Management</h1>
        <p className="mt-2 text-slate-600">
          Manage the labels and values shown in the public market ticker.
        </p>
      </header>

      {message ? (
        <div
          role={isError ? "alert" : "status"}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <span>{message}</span>
          {isError ? (
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-bold"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h2 className="text-lg font-bold">Current Ticker Items</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use the arrows to adjust order, then save your changes.
            </p>
          </div>
          <button
            type="button"
            disabled={Boolean(busy) || items.length === 0}
            onClick={() => void saveOrder()}
            className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-50"
          >
            {busy === "order" ? "Saving…" : "Save Order"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Label", "Value", "Type", "Status", "Order", "Actions"].map((label) => (
                  <th key={label} className="px-5 py-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Loading ticker items…
                  </td>
                </tr>
              ) : items.length ? items.map((item, index) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold">{item.label}</td>
                  <td className="max-w-80 px-5 py-4">{item.value}</td>
                  <td className="px-5 py-4">{TYPE_LABELS[item.type] || item.type}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${item.label} up`}
                        disabled={index === 0 || Boolean(busy)}
                        onClick={() => move(index, -1)}
                        className="rounded-lg border px-2 py-1 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${item.label} down`}
                        disabled={index === items.length - 1 || Boolean(busy)}
                        onClick={() => move(index, 1)}
                        className="rounded-lg border px-2 py-1 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <span className="ml-2 tabular-nums">{item.displayOrder}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => openEdit(item)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void toggleActive(item)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                      >
                        {busy === `toggle-${item.id}`
                          ? "Saving…"
                          : item.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void remove(item)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50"
                      >
                        {busy === `delete-${item.id}` ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    No ticker items yet. Add the first item below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Add New Ticker Item</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a market price, announcement, website update, or promotion.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="h-11 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white"
          >
            Add Ticker Item
          </button>
        </div>
      </section>

      <aside className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
        <h2 className="text-lg font-bold">How ticker items appear</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Example
            title="Market Price"
            label="Vannamei C30"
            value="₹445/kg ▲ 2.1%"
            description="Andhra Pradesh farm-gate average"
          />
          <Example
            title="Announcement"
            label="Event Update"
            value="Shrimp Retail 2026 registrations are open"
            description="29–30 September 2026, Vijayawada"
          />
          <Example
            title="Promotion"
            label="Telaqua"
            value="Smart pond water-quality monitoring"
            description="Monitor pH and other pond conditions using Telaqua devices."
            link="Learn More"
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          These are examples only and are not saved automatically.
        </p>
      </aside>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Ticker Last Updated</h2>
        <p className="mt-1 text-sm text-slate-500">
          This date appears beside the public market ticker to show when the prices
          or updates were last reviewed.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-semibold">
            Date and time
            <input
              type="datetime-local"
              value={lastUpdated}
              onChange={(event) => setLastUpdated(event.target.value)}
              className={input}
            />
          </label>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => setLastUpdated(toLocalInput(new Date().toISOString()))}
            className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold disabled:opacity-50"
          >
            Use Current Date &amp; Time
          </button>
          <button
            type="button"
            disabled={Boolean(busy) || !lastUpdated}
            onClick={() => void saveLastUpdated()}
            className="h-11 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy === "meta" ? "Saving…" : "Save Last Updated"}
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Saved value:{" "}
          <span className="font-semibold text-slate-700">
            {savedLastUpdated
              ? new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(savedLastUpdated))
              : "Not set"}
          </span>
        </p>
      </section>

      {formOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticker-form-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={submit} className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="ticker-form-title" className="text-xl font-bold">
                    {form.id ? "Edit Ticker Item" : "Add Ticker Item"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the wording exactly as it should appear in the ticker.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border px-3 py-1.5 text-sm font-bold"
                  aria-label="Close ticker item form"
                >
                  Close
                </button>
              </div>

              <label className="block text-sm font-semibold">
                Label *
                <input
                  required
                  value={form.label}
                  onChange={(event) => setField("label", event.target.value)}
                  className={input}
                  placeholder="Vannamei C30"
                />
                <span className={helper}>The name shown before the ticker value. Example: Vannamei C30</span>
              </label>

              <label className="block text-sm font-semibold">
                Value *
                <input
                  required
                  value={form.value}
                  onChange={(event) => setField("value", event.target.value)}
                  className={input}
                  placeholder="₹445/kg ▲ 2.1%"
                />
                <span className={helper}>The price, update or promotional message shown in the ticker. Example: ₹445/kg ▲ 2.1%</span>
              </label>

              <label className="block text-sm font-semibold">
                Type
                <select
                  value={form.type}
                  onChange={(event) => setField("type", event.target.value as TickerItemType)}
                  className={input}
                >
                  <option value="market">Market Price</option>
                  <option value="announcement">Announcement</option>
                  <option value="update">Website Update</option>
                  <option value="promotion">Promotion</option>
                </select>
                <span className={helper}>Choose what kind of information this item contains.</span>
              </label>

              <label className="block text-sm font-semibold">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  className={`${input} min-h-24 py-3`}
                />
                <span className={helper}>Optional extra information shown when the user clicks or hovers over the item.</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setField("isActive", event.target.checked)}
                  className="h-4 w-4"
                />
                Active — show this item publicly when its schedule allows
              </label>

              <details
                open={advancedOpen}
                onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
                className="rounded-xl border"
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold">
                  Advanced Options
                </summary>
                <div className="grid gap-4 border-t p-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Link URL
                    <input
                      type="url"
                      value={form.linkUrl}
                      onChange={(event) => setField("linkUrl", event.target.value)}
                      className={input}
                      placeholder="https://…"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Link label
                    <input
                      value={form.linkLabel}
                      onChange={(event) => setField("linkLabel", event.target.value)}
                      className={input}
                      placeholder="Learn More"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Start date
                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) => setField("startsAt", event.target.value)}
                      className={input}
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    End date
                    <input
                      type="datetime-local"
                      min={form.startsAt || undefined}
                      value={form.endsAt}
                      onChange={(event) => setField("endsAt", event.target.value)}
                      className={input}
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Display order
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(event) => setField("displayOrder", event.target.value)}
                      className={input}
                    />
                  </label>
                  <div className="space-y-3 text-sm font-semibold">
                    Optional image
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" className="mt-2 h-24 w-36 rounded-xl object-cover" />
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border bg-white px-3 text-xs font-bold">
                        {busy === "upload" ? "Uploading…" : "Upload image"}
                        <input
                          ref={imageInputRef}
                          disabled={busy === "upload"}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadImage(file);
                          }}
                        />
                      </label>
                      {form.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setField("imageUrl", "")}
                          className="h-10 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600"
                        >
                          Remove image
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </details>

              <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={closeForm}
                  className="h-11 rounded-xl border px-5 text-sm font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(busy)}
                  className="h-11 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy === "form"
                    ? "Saving…"
                    : form.id ? "Save Changes" : "Add Ticker Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Example({
  title,
  label,
  value,
  description,
  link,
}: {
  title: string;
  label: string;
  value: string;
  description: string;
  link?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 text-sm shadow-sm">
      <p className="font-bold text-[#0B4F7A]">{title}</p>
      <dl className="mt-3 space-y-2 text-slate-600">
        <div><dt className="font-semibold text-slate-800">Label</dt><dd>{label}</dd></div>
        <div><dt className="font-semibold text-slate-800">Value</dt><dd>{value}</dd></div>
        <div><dt className="font-semibold text-slate-800">Description</dt><dd>{description}</dd></div>
        {link ? <div><dt className="font-semibold text-slate-800">Link</dt><dd>{link}</dd></div> : null}
      </dl>
    </div>
  );
}
