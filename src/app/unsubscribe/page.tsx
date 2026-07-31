import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/newsletter/unsubscribe-form";
import { isValidUnsubscribeToken } from "@/lib/newsletter/tokens";
import { logDatabaseError, prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Unsubscribe | Shrimp.News",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const value = (await searchParams).token;
  const token =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  let state: "confirm" | "invalid" | "inactive" | "error" = "invalid";
  if (isValidUnsubscribeToken(token)) {
    try {
      const subscriber = await prisma.subscriber.findUnique({
        where: { unsubscribeToken: token },
        select: { isActive: true },
      });
      state = !subscriber ? "invalid" : subscriber.isActive ? "confirm" : "inactive";
    } catch (error) {
      logDatabaseError("newsletter.unsubscribe-page", error);
      state = "error";
    }
  }

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF4F2E]">
          Email preferences
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-[#0B3A6E]">
          Unsubscribe from Shrimp.News
        </h1>
        <div className="mt-6">
          {state === "confirm" ? <UnsubscribeForm token={token} /> : null}
          {state === "invalid" ? (
            <p role="alert" className="text-base font-medium text-red-600">
              This unsubscribe link is missing or invalid.
            </p>
          ) : null}
          {state === "inactive" ? (
            <p role="status" className="text-base font-medium text-slate-700">
              This subscription is already inactive.
            </p>
          ) : null}
          {state === "error" ? (
            <p role="alert" className="text-base font-medium text-red-600">
              Unable to load email preferences right now. Please try again.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
