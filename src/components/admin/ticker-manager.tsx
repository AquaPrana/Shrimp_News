"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type TickerDirection = "up" | "down" | "neutral";

type TickerItemRow = {
  id: string;
  label: string;
  price: number;
  currency: string;
  unit: string;
  changePercent: number | null;
  direction: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

type FormState = {
  id: string | null;
  label: string;
  price: string;
  currency: string;
  unit: string;
  changePercent: string;
  direction: TickerDirection;
  sortOrder: string;
  isActive: boolean;
  updatedAtLocal: string;
};

const DEFAULT_UPDATED_LOCAL = "2026-07-15T18:00";

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return DEFAULT_UPDATED_LOCAL;

  const pad = (value: number) => String(value).padStart(2, "0");
  // Display/edit in IST (UTC+5:30) to match the required admin timestamp.
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
}

function localInputToIso(localValue: string) {
  // Treat admin datetime-local as IST and convert to UTC ISO.
  const match = localValue.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return "";
  const [, y, m, d, hh, mm] = match;
  const utcMs = Date.UTC(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh) - 5,
    Number(mm) - 30,
  );
  return new Date(utcMs).toISOString();
}

function emptyForm(sortOrder = 0): FormState {
  return {
    id: null,
    label: "",
    price: "",
    currency: "INR",
    unit: "kg",
    changePercent: "",
    direction: "neutral",
    sortOrder: String(sortOrder),
    isActive: true,
    updatedAtLocal: DEFAULT_UPDATED_LOCAL,
  };
}

function formFromItem(item: TickerItemRow): FormState {
  return {
    id: item.id,
    label: item.label,
    price: String(item.price),
    currency: item.currency || "INR",
    unit: item.unit || "kg",
    changePercent:
      item.changePercent == null ? "" : String(item.changePercent),
    direction: (["up", "down", "neutral"].includes(item.direction)
      ? item.direction
      : "neutral") as TickerDirection,
    sortOrder: String(item.sortOrder),
    isActive: item.isActive,
    updatedAtLocal: toLocalInputValue(item.updatedAt),
  };
}

export function TickerManager() {
  const [items, setItems] = useState<TickerItemRow[]>([]);
  const [lastUpdatedLocal, setLastUpdatedLocal] = useState(DEFAULT_UPDATED_LOCAL);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ticker", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to load ticker items.");
      }
      setItems(body.items || []);
      if (typeof body.lastUpdated === "string") {
        setLastUpdatedLocal(toLocalInputValue(body.lastUpdated));
      }
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to load ticker items.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveLastUpdated() {
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/admin/ticker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "updateLastUpdated",
          lastUpdated: localInputToIso(lastUpdatedLocal),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to save last updated time.");
      }
      if (typeof body.lastUpdated === "string") {
        setLastUpdatedLocal(toLocalInputValue(body.lastUpdated));
      }
      setMessage(body.message || "Last updated time saved.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save last updated time.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);

    const payload = {
      id: form.id || undefined,
      label: form.label,
      price: Number(form.price),
      currency: form.currency,
      unit: form.unit,
      changePercent:
        form.changePercent.trim() === "" ? null : Number(form.changePercent),
      direction: form.direction,
      sortOrder: Number(form.sortOrder || 0),
      isActive: form.isActive,
      updatedAt: localInputToIso(form.updatedAtLocal),
    };

    try {
      const response = await fetch("/api/admin/ticker", {
        method: form.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to save ticker item.");
      }
      setMessage(body.message || "Ticker item saved.");
      setForm(emptyForm(items.length + (form.id ? 0 : 1)));
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to save ticker item.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm("Delete this ticker item?")) return;
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/admin/ticker", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Unable to delete ticker item.");
      }
      setMessage(body.message || "Ticker item deleted.");
      if (form.id === id) setForm(emptyForm(items.length));
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to delete ticker item.",
      );
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">
          Markets
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Price Ticker Management</h1>
        <p className="mt-2 text-slate-600">
          Manually update market values shown in the homepage ticker. These are
          curated values, not live API prices.
        </p>
      </header>

      {message ? (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">Ticker last updated</h2>
          <p className="mt-1 text-sm text-slate-500">
            Controls the “Last updated” label on the website ticker.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-semibold">
            Date and time
            <input
              type="datetime-local"
              value={lastUpdatedLocal}
              onChange={(event) => setLastUpdatedLocal(event.target.value)}
              className={input}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveLastUpdated()}
            className="h-11 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            Save last updated
          </button>
        </div>
      </section>

      <form
        onSubmit={submitItem}
        className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-bold">
            {form.id ? "Edit ticker item" : "Add ticker item"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add or update a market name, value, change, and status.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Item / market name
            <input
              required
              value={form.label}
              onChange={(event) => setField("label", event.target.value)}
              className={input}
              placeholder="Vannamei C40"
            />
          </label>
          <label className="block text-sm font-semibold">
            Price or value
            <input
              required
              type="number"
              step="any"
              value={form.price}
              onChange={(event) => setField("price", event.target.value)}
              className={input}
              placeholder="362"
            />
          </label>
          <label className="block text-sm font-semibold">
            Currency
            <input
              value={form.currency}
              onChange={(event) => setField("currency", event.target.value)}
              className={input}
              placeholder="INR"
            />
          </label>
          <label className="block text-sm font-semibold">
            Unit
            <input
              value={form.unit}
              onChange={(event) => setField("unit", event.target.value)}
              className={input}
              placeholder="kg"
            />
          </label>
          <label className="block text-sm font-semibold">
            Percentage change
            <input
              type="number"
              step="any"
              value={form.changePercent}
              onChange={(event) => setField("changePercent", event.target.value)}
              className={input}
              placeholder="2.1"
            />
          </label>
          <label className="block text-sm font-semibold">
            Increase / decrease status
            <select
              value={form.direction}
              onChange={(event) =>
                setField("direction", event.target.value as TickerDirection)
              }
              className={input}
            >
              <option value="up">Increase</option>
              <option value="down">Decrease</option>
              <option value="neutral">Neutral</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Updated date and time
            <input
              required
              type="datetime-local"
              value={form.updatedAtLocal}
              onChange={(event) => setField("updatedAtLocal", event.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-semibold">
            Sort order
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => setField("sortOrder", event.target.value)}
              className={input}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setField("isActive", event.target.checked)}
          />
          Show in ticker
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-xl bg-[#0B4F7A] px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : form.id ? "Update item" : "Add item"}
          </button>
          {form.id ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setForm(emptyForm(items.length))}
              className="h-11 rounded-xl border px-5 text-sm font-bold disabled:opacity-50"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  Loading ticker items…
                </td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {item.currency || "—"} · {item.unit || "—"} · order{" "}
                      {item.sortOrder}
                      {!item.isActive ? " · hidden" : ""}
                    </p>
                  </td>
                  <td className="px-4">{item.price}</td>
                  <td className="px-4">
                    {item.changePercent == null ? "—" : `${item.changePercent}%`}
                  </td>
                  <td className="px-4 capitalize">{item.direction}</td>
                  <td className="px-4 text-xs text-slate-600">
                    {toLocalInputValue(item.updatedAt).replace("T", " ")}
                  </td>
                  <td className="px-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(formFromItem(item))}
                        className="rounded-lg border px-3 py-1.5 text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void removeItem(item.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  No ticker items yet. Add the first market value above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
