"use client";

declare global { interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void } }
export function trackEvent(name: string, parameters: Record<string, string | number | undefined | null> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, { ...Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== undefined && value !== null && value !== "")), transport_type: "beacon" });
}
