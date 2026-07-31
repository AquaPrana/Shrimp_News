"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { parseNewsletterEmail } from "@/lib/newsletter/email-validation";

const INVALID_EMAIL_MESSAGE = "Please enter a valid email address.";
const GENERAL_FAILURE_MESSAGE = "Unable to subscribe right now. Please try again.";
const SUCCESS_MESSAGE = "Thank you for subscribing to Shrimp.News.";
const ALREADY_SUBSCRIBED_MESSAGE = "You're already subscribed to Shrimp.News.";

export function NewsletterSection() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailInvalid = error === INVALID_EMAIL_MESSAGE;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const parsed = parseNewsletterEmail(email);
    if (!parsed.ok) {
      setError(INVALID_EMAIL_MESSAGE);
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: parsed.email }),
      });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        code?: string;
        message?: string;
      } | null;

      if (response.ok && body?.success !== false) {
        const code = (body?.code || "").toUpperCase();
        if (code === "ALREADY_SUBSCRIBED") {
          setMessage(body?.message || ALREADY_SUBSCRIBED_MESSAGE);
        } else {
          setMessage(body?.message || SUCCESS_MESSAGE);
        }
        setEmail("");
        return;
      }

      if (body?.code === "INVALID_EMAIL") {
        setError(INVALID_EMAIL_MESSAGE);
        return;
      }

      setError(body?.message || GENERAL_FAILURE_MESSAGE);
    } catch {
      setError(GENERAL_FAILURE_MESSAGE);
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
                <p className="text-sm font-medium text-slate-600">
                  {t("newsletterMondayNote")}
                </p>
                <div>
                  {error ? (
                    <p
                      id="newsletter-email-error"
                      role="alert"
                      className="mb-1 text-[14px] font-medium text-red-600"
                    >
                      {error}
                    </p>
                  ) : null}
                  <label htmlFor="newsletter-email" className="sr-only">
                    {t("newsletterEmailLabel")}
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        const nextEmail = event.target.value;
                        setEmail(nextEmail);
                        if (
                          emailInvalid &&
                          parseNewsletterEmail(nextEmail).ok
                        ) {
                          setError("");
                        }
                      }}
                      placeholder={t("newsletterEmailPlaceholder")}
                      disabled={busy}
                      aria-invalid={emailInvalid}
                      aria-describedby={
                        error ? "newsletter-email-error" : undefined
                      }
                      className={`h-12 flex-1 rounded-2xl border bg-white px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition focus:ring-2 disabled:opacity-60 ${
                        emailInvalid
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-400/20"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-12 rounded-2xl bg-[#FF4F2E] px-6 text-sm font-bold text-white transition hover:bg-[#FF6548] hover:shadow-[0_8px_24px_rgba(255,79,46,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Subscribing..." : "Subscribe free"}
                    </button>
                  </div>
                </div>
                {message ? (
                  <p role="status" className="text-sm font-medium text-green-700">
                    {message}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
