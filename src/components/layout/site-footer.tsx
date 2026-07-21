"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import {
  useLanguage,
  type TranslationKey,
} from "@/context/language-context";

type FooterLink = {
  labelKey: TranslationKey;
  href: string;
};

const categoryLinks: FooterLink[] = [
  {
    labelKey: "latestNews",
    href: "/articles",
  },
  {
    labelKey: "shrimpFarming",
    href: "/articles?topic=shrimp-farming",
  },
  {
    labelKey: "marketsIndustry",
    href: "/markets-industry",
  },
  {
    labelKey: "domesticConsumption",
    href: "/domestic-consumption",
  },
  {
    labelKey: "aquaticHealth",
    href: "/articles?topic=shrimp-health",
  },
  {
    labelKey: "researchInnovation",
    href: "/articles?topic=research-innovations",
  },
  {
    labelKey: "technologyEquipment",
    href: "/articles?topic=technology-equipment",
  },
  {
    labelKey: "prices",
    href: "/articles?topic=shrimp-prices",
  },
];

const socialLinksByLanguage = {
  en: [
    {
      label: "Shrimp News English Facebook",
      href: "https://www.facebook.com/profile.php?id=61580776233747",
      icon: FaFacebookF,
    },
    {
      label: "Shrimp News English Instagram",
      href: "https://www.instagram.com/shrimpnewsenglish?igsh=MWg5ZmpvdzZ3bmo4cg==",
      icon: FaInstagram,
    },
    {
      label: "Shrimp News X",
      href: "https://x.com/Shrimp_News",
      icon: FaXTwitter,
    },
    {
      label: "Shrimp News LinkedIn",
      href: "https://www.linkedin.com/company/shrimpnews/",
      icon: FaLinkedinIn,
    },
    {
      label: "Shrimp News English YouTube",
      href: "https://www.youtube.com/@ShrimpNewsEnglish",
      icon: FaYoutube,
    },
  ],
  hi: [
    {
      label: "Shrimp News Hindi Facebook",
      href: "https://www.facebook.com/profile.php?id=61583544692855",
      icon: FaFacebookF,
    },
    {
      label: "Shrimp News Hindi Instagram",
      href: "https://www.instagram.com/shrimpnews.in?igsh=MXg0ODF5MWhrbmlncg==",
      icon: FaInstagram,
    },
    {
      label: "Shrimp News X",
      href: "https://x.com/Shrimp_News",
      icon: FaXTwitter,
    },
    {
      label: "Shrimp News LinkedIn",
      href: "https://www.linkedin.com/company/shrimpnews/",
      icon: FaLinkedinIn,
    },
    {
      label: "Shrimp News Hindi YouTube",
      href: "https://www.youtube.com/@ShrimpNews1",
      icon: FaYoutube,
    },
  ],
  te: [
    {
      label: "Shrimp News Telugu Facebook",
      href: "https://www.facebook.com/profile.php?id=61577296447930",
      icon: FaFacebookF,
    },
    {
      label: "Shrimp News Telugu Instagram",
      href: "https://www.instagram.com/shrimpnewstelugu?igsh=eTRhc250YmVkODNh",
      icon: FaInstagram,
    },
    {
      label: "Shrimp News X",
      href: "https://x.com/Shrimp_News",
      icon: FaXTwitter,
    },
    {
      label: "Shrimp News LinkedIn",
      href: "https://www.linkedin.com/company/shrimpnews/",
      icon: FaLinkedinIn,
    },
    {
      label: "Shrimp News Telugu YouTube",
      href: "https://www.youtube.com/@ShrimpNewsTelugu",
      icon: FaYoutube,
    },
  ],
} as const;

export function SiteFooter() {
  const { language, t } = useLanguage();

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <footer className="bg-[#071A33] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_1fr] lg:gap-14">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label="Shrimp News home"
              className="inline-flex"
            >
              <Image
                src="/images/shrimp-news-logo.png"
                alt="Shrimp News"
                width={190}
                height={80}
                className="h-auto w-[160px] object-contain"
              />
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
              {t("footerTagline")}
            </p>

            <p className="mt-3 text-sm font-semibold text-[#ff6a3d]">
              {t("footerSubTagline")}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.28em] text-[#ff9a66]">
              {t("categories")}
            </h3>

            <nav className="mt-5 grid gap-2.5">
              {categoryLinks.map((link) => (
                <Link
                  key={link.labelKey}
                  href={link.href}
                  className="group flex items-center gap-3 text-sm font-medium text-white/85 transition hover:translate-x-1 hover:text-cyan-300"
                >
                  <span className="text-[#ff6a3d] transition group-hover:text-cyan-300">
                    ›
                  </span>

                  <span>{t(link.labelKey)}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Social and Legal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.28em] text-[#ff9a66]">
              {t("followShrimpNews")}
            </h3>

            <div className="mt-5 flex flex-wrap items-start gap-x-3 gap-y-4">
              {socialLinksByLanguage[language].map(
                ({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group flex w-16 flex-col items-center gap-2 text-center"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/25 bg-[#0B345B] text-white transition duration-200 group-hover:-translate-y-1 group-hover:border-cyan-300 group-hover:bg-cyan-400 group-hover:text-[#071A33]">
                      <Icon className="h-4 w-4" />
                    </span>
                  </a>
                ),
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              <Link
                href="/privacy-policy"
                className="text-white/85 transition hover:text-cyan-300"
              >
                {t("privacyPolicy")}
              </Link>

              <Link
                href="/terms"
                className="text-white/85 transition hover:text-cyan-300"
              >
                {t("terms")}
              </Link>

              <Link
                href="/disclaimer"
                className="text-white/85 transition hover:text-cyan-300"
              >
                {t("disclaimer")}
              </Link>

              <Link
                href="/contact"
                className="text-white/85 transition hover:text-cyan-300"
              >
                {t("contact")}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-9 flex flex-col gap-4 border-t border-white/15 pt-5 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("allRightsReserved")}</p>

          <button
            type="button"
            onClick={scrollToTop}
            className="w-fit font-semibold text-white/85 transition hover:text-cyan-300"
          >
            ↑ {t("backToTop")}
          </button>
        </div>
      </div>
    </footer>
  );
}
