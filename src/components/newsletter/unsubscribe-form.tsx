"use client";

import { useState } from "react";

export function UnsubscribeForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const unsubscribe = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message || "Unable to unsubscribe right now. Please try again.");
        return;
      }
      setMessage(
        body.message ||
          "You have successfully unsubscribed from Shrimp.News emails.",
      );
    } catch {
      setError("Unable to unsubscribe right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (message) {
    return (
      <p role="status" className="text-base font-medium text-emerald-700">
        {message}
      </p>
    );
  }

  return (
    <div>
      <p className="text-base leading-7 text-slate-600">
        Confirm that you want to stop receiving Shrimp.News emails.
      </p>
      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={unsubscribe}
        disabled={busy}
        className="mt-6 rounded-xl bg-[#FF4F2E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#FF6548] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Unsubscribing..." : "Confirm unsubscribe"}
      </button>
    </div>
  );
}
