"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  useLanguage,
  type TranslationKey,
} from "@/context/language-context";

type DropdownKey = "news" | "topics";

type NavItem =
  | { labelKey: TranslationKey; href: string }
  | {
      key: DropdownKey;
      labelKey: TranslationKey;
      submenu: Array<{ labelKey: TranslationKey; href: string }>;
    };

const navItems: NavItem[] = [
  { labelKey: "home", href: "/" },
  {
    key: "news",
    labelKey: "news",
    submenu: [
      { labelKey: "india", href: "/articles?topic=national" },
      { labelKey: "global", href: "/articles?topic=international" },
    ],
  },
  {
    key: "topics",
    labelKey: "topics",
    submenu: [
      { labelKey: "shrimpFarming", href: "/farming" },
      { labelKey: "shrimpHealth", href: "/health" },
      { labelKey: "technologyEquipment", href: "/technology" },
      {
        labelKey: "researchInnovations",
        href: "/technology?topic=research",
      },
      { labelKey: "shrimpPrices", href: "/prices" },
    ],
  },
  {
    labelKey: "domesticConsumption",
    href: "/domestic-consumption",
  },
  {
    labelKey: "marketsIndustry",
    href: "/markets-industry",
  },
  { labelKey: "about", href: "/about" },
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

function NavLabel({
  children,
  active,
  as = "link",
}: {
  children: ReactNode;
  active: boolean;
  as?: "link" | "button";
}) {
  const base =
    "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-[#FF5A36] after:transition-all after:duration-200 focus-visible:outline-none";

  const tone = active
    ? "text-[#FF5A36] after:w-full"
    : "text-[#1E3A5F] after:w-0 hover:text-[#FF5A36] hover:after:w-full focus-visible:text-[#FF5A36]";

  return (
    <span className={`${base} ${tone}`} data-nav={as}>
      {children}
    </span>
  );
}

export function DesktopNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openDropdown, setOpenDropdown] =
    useState<DropdownKey | null>(null);

  const navRef = useRef<HTMLElement | null>(null);

  const closeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener("keydown", handleEscape);

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname, searchParams]);

  function openMenu(key: DropdownKey) {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    setOpenDropdown(key);
  }

  function scheduleClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  }

  function cancelClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  }

  return (
    <nav
      ref={navRef}
      aria-label="Primary navigation"
      className="flex w-max max-w-none items-center justify-center gap-3 overflow-visible text-[#1E3A5F] xl:gap-5 2xl:gap-6"
    >
      {navItems.map((item) => {
        if ("submenu" in item) {
          const isOpen = openDropdown === item.key;

          const isParentActive = item.submenu.some((subItem) =>
            isHrefActive(
              subItem.href,
              pathname,
              searchParams,
            ),
          );

          return (
            <div
              key={item.key}
              className="relative shrink-0"
              onMouseEnter={() => {
                cancelClose();
                openMenu(item.key);
              }}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    isOpen ? null : item.key,
                  )
                }
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="bg-transparent p-0"
              >
                <NavLabel
                  active={isParentActive || isOpen}
                  as="button"
                >
                  {t(item.labelKey)}

                  <span
                    aria-hidden="true"
                    className={`text-[10px] transition-transform duration-200 ${
                      isOpen || isParentActive
                        ? "rotate-180 text-[#FF5A36]"
                        : "text-[#1E3A5F]"
                    }`}
                  >
                    ▼
                  </span>
                </NavLabel>
              </button>

              <div
                className={`absolute left-0 top-full z-[120] min-w-[230px] pt-3 transition-all duration-150 ${
                  isOpen
                    ? "pointer-events-auto visible translate-y-0 opacity-100"
                    : "pointer-events-none invisible -translate-y-1 opacity-0"
                }`}
                onMouseEnter={() => {
                  cancelClose();
                  openMenu(item.key);
                }}
                onMouseLeave={scheduleClose}
              >
                <div
                  role="menu"
                  className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                >
                  {item.submenu.map((subItem) => {
                    const active = isHrefActive(
                      subItem.href,
                      pathname,
                      searchParams,
                    );

                    return (
                      <Link
                        key={`${item.key}-${subItem.href}-${subItem.labelKey}`}
                        href={subItem.href}
                        role="menuitem"
                        onClick={() =>
                          setOpenDropdown(null)
                        }
                        className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                          active
                            ? "bg-[#FFF4EE] text-[#FF5A36]"
                            : "text-[#1E3A5F] hover:bg-[#FFF4EE] hover:text-[#FF5A36]"
                        }`}
                      >
                        {t(subItem.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        const active = isHrefActive(
          item.href,
          pathname,
          searchParams,
        );

        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0"
            aria-current={active ? "page" : undefined}
          >
            <NavLabel active={active}>
              {t(item.labelKey)}
            </NavLabel>
          </Link>
        );
      })}
    </nav>
  );
}
