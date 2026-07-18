"use client";

import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";

const SHRIMP_PRICES = [
  ["20 Count", "₹710"],
  ["25 Count", "₹570"],
  ["30 Count", "₹445"],
  ["35 Count", "₹355"],
  ["36/37 Count", "₹350"],
  ["40 Count", "₹345"],
  ["45 Count", "₹315"],
  ["46/47 Count", "₹310"],
  ["50 Count", "₹310"],
  ["60 Count", "₹290"],
  ["70 Count", "₹275"],
  ["80 Count", "₹270"],
  ["90 Count", "₹250"],
  ["100 Count", "₹240"],
  ["200 Count", "₹180"],
] as const;

export default function PricesPage() {
  return (
    <PageShell
      eyebrowKey="pricesEyebrow"
      titleKey="pricesTitle"
      descriptionKey="pricesDescription"
    >
      <div className={PAGE_CONTENT_PANEL_CLASS}>
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              Latest Vannamei Shrimp Prices in India
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="border border-slate-200 px-4 py-3 font-semibold text-[#0B3A6E]">
                    Shrimp Count
                  </th>
                  <th className="border border-slate-200 px-4 py-3 font-semibold text-[#0B3A6E]">
                    Price (₹/kg)
                  </th>
                </tr>
              </thead>
              <tbody>
                {SHRIMP_PRICES.map(([count, price]) => (
                  <tr key={count}>
                    <td className="border border-slate-200 px-4 py-3">
                      {count}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              Market Snapshot
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Highest Price: 20 Count – ₹710/kg</li>
              <li>Lowest Price: 200 Count – ₹180/kg</li>
              <li>
                Medium-sized shrimp (40–60 count) traded between ₹290–₹345/kg.
              </li>
              <li>
                Larger shrimp (20–30 count) continued to command premium prices.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              About Shrimp Prices
            </h2>
            <p>
              Farmgate shrimp prices vary depending on shrimp count, harvest
              volumes, buyer demand, product quality, and prevailing market
              conditions. Regular price monitoring helps farmers plan harvests,
              negotiate better with buyers, and make informed marketing
              decisions.
            </p>
            <p>
              Shrimp.News publishes regular shrimp price updates to keep the
              shrimp industry informed with timely and reliable market
              information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B3A6E] sm:text-2xl">
              Disclaimer
            </h2>
            <p>
              The prices published on Shrimp.News are indicative farmgate
              prices collected from industry market sources for informational
              purposes only. Actual prices may vary depending on location,
              quality, procurement volume, buyer requirements, and prevailing
              market conditions.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
