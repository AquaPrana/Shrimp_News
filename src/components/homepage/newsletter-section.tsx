"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/context/language-context";

export function NewsletterSection() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("newsletterEmptyError"));
      setMessage("");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t("newsletterInvalidError"));
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Unable to subscribe right now.");
        return;
      }
      setMessage(`${t("newsletterSuccessPrefix")} ${trimmedEmail}! ${t("newsletterSuccessSuffix")}`);
      setEmail("");
    } catch {
      setError("Unable to subscribe right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="home-reveal mx-auto max-w-7xl">
        <div className="newsletter-frame relative overflow-hidden rounded-[28px] p-[2px]">
          <div className="newsletter-border-glow pointer-events-none absolute inset-0 rounded-[28px]" />

          <div className="relative rounded-[26px] border border-slate-200/80 bg-gradient-to-br from-white via-[#F7FBFF] to-[#EAF4FF] px-6 py-8 shadow-[0_16px_48px_rgba(11,79,140,0.08)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#ff6a3d]">
                  {t("newsletterEyebrow")}
                </p>
                <h2 className="text-3xl font-extrabold text-[#0B3A6E] sm:text-4xl">
                  {t("newsletterTitle")}
                </h2>
                <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                  {t("newsletterDescription")}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl space-y-3"
                noValidate
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  {t("newsletterEmailLabel")}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-12 rounded-2xl bg-[#FF4F2E] px-6 text-sm font-bold text-white transition hover:bg-[#FF6548] hover:shadow-[0_8px_24px_rgba(255,79,46,0.28)]"
                  >
                    {busy ? "Subscribing…" : t("newsletterSubscribe")}
                  </button>
                </div>
                {error ? (
                  <p className="text-sm text-orange-600">{error}</p>
                ) : null}
                {message ? (
                  <p className="text-sm text-emerald-600">{message}</p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
