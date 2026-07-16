"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/layout/language-selector";
import { useLanguage, type TranslationKey } from "@/context/language-context";

type NavItem =
  | { labelKey: TranslationKey; href: string }
  | {
      labelKey: TranslationKey;
      submenu: Array<{ labelKey: TranslationKey; href: string }>;
    };

const navItems: NavItem[] = [
  { labelKey: "home", href: "/" },
  {
    labelKey: "news",
    submenu: [
      { labelKey: "india", href: "/articles?topic=national" },
      { labelKey: "global", href: "/articles?topic=international" },
    ],
  },
  {
    labelKey: "topics",
    submenu: [
      { labelKey: "shrimpFarming", href: "/farming" },
      { labelKey: "shrimpHealth", href: "/health" },
      { labelKey: "technologyEquipment", href: "/technology" },
      { labelKey: "researchInnovations", href: "/technology?topic=research" },
      { labelKey: "shrimpPrices", href: "/prices" },
    ],
  },
  { labelKey: "domesticConsumption", href: "/domestic-consumption" },
  { labelKey: "marketsIndustry", href: "/markets-industry" },
  {
    labelKey: "about",
    submenu: [
      { labelKey: "aboutUs", href: "/about" },
      { labelKey: "foundersMessage", href: "/founder" },
      { labelKey: "contactUs", href: "/contact" },
    ],
  },
];

function parseHref(href: string) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  return { path, params };
}

function isHrefActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams,
) {
  const { path, params } = parseHref(href);

  if (path === "/") {
    return pathname === "/";
  }

  if (pathname !== path) {
    return false;
  }

  for (const [key, value] of params.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  if (path === "/technology" && !params.has("topic")) {
    return !searchParams.get("topic");
  }

  if (path === "/articles" && !params.has("topic")) {
    return !searchParams.get("topic");
  }

  return true;
}

export function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className={`lg:hidden ${open ? "block" : "hidden"}`}>
      <div className="max-h-[min(78dvh,720px)] overflow-y-auto border-t border-slate-800/80 bg-slate-950/95 px-4 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex justify-end">
          <LanguageSelector />
        </div>

        <div className="space-y-3">
          {navItems.map((item) => {
            if ("submenu" in item) {
              const key = item.labelKey;
              const isOpen = expanded === key;
              const isParentActive = item.submenu.some((subItem) =>
                isHrefActive(subItem.href, pathname, searchParams),
              );

              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left text-sm transition ${
                      isParentActive
                        ? "border-sky-400 bg-[#0B4F7A] text-sky-300"
                        : "border-cyan-400/20 bg-[#0B4F7A] text-cyan-50 hover:border-sky-400 hover:text-sky-300"
                    }`}
                  >
                    <span>{t(item.labelKey)}</span>
                    <span className="text-cyan-100/70">
                      {isOpen ? "−" : "▼"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="mt-2 space-y-2 rounded-3xl border border-cyan-300/20 bg-[#062849] p-3">
                      {item.submenu.map((subItem) => {
                        const active = isHrefActive(
                          subItem.href,
                          pathname,
                          searchParams,
                        );

                        return (
                          <Link
                            key={`${key}-${subItem.href}-${subItem.labelKey}`}
                            href={subItem.href}
                            className={`block rounded-2xl px-4 py-3 text-sm transition hover:bg-white/10 hover:text-sky-300 ${
                              active
                                ? "bg-white/10 text-sky-300"
                                : "text-cyan-50"
                            }`}
                            onClick={onClose}
                          >
                            {t(subItem.labelKey)}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            const active = isHrefActive(item.href, pathname, searchParams);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-3xl border px-4 py-3 text-sm text-cyan-50 transition hover:border-sky-400 hover:text-sky-300 ${
                  active
                    ? "border-sky-400 bg-[#0B4F7A] !text-sky-300"
                    : "border-cyan-400/20 bg-[#0B4F7A]"
                }`}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="mt-5">
          <Link href="/ask-aquaprana" className="block" onClick={onClose}>
            <Button variant="primary" size="lg" fullWidth>
              {t("askAquaGPTButton")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
