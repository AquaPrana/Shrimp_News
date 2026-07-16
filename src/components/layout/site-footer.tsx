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

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: FaInstagram,
  },
  {
    label: "X",
    href: "https://x.com",
    icon: FaXTwitter,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    icon: FaLinkedinIn,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com",
    icon: FaYoutube,
  },
];

export function SiteFooter() {
  const { t } = useLanguage();

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

            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/25 bg-[#0B345B] text-white transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-400 hover:text-[#071A33]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              <Link
                href="/privacy"
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
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-9 flex flex-col gap-4 border-t border-white/15 pt-5 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold text-white">Shrimp News</span>
            {" · "}
            © {new Date().getFullYear()} {t("allRightsReserved")}
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="w-fit font-semibold text-white/85 transition hover:text-cyan-300"
          >
            ↑ Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}