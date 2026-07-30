"use client";

import Image from "next/image";
import Link from "next/link";
import { X as CloseIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
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
import {
  getAvailableSocialLinks,
  isValidSocialUrl,
} from "@/lib/social-links";

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
    href: "/articles?topic=research",
  },
  {
    labelKey: "technologyEquipment",
    href: "/articles?topic=technology",
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

type SocialLanguage = keyof typeof socialLinksByLanguage;

type SocialPlatform = {
  id: string;
  name: string;
  icon: IconType;
  links: Partial<Record<SocialLanguage, string>>;
};

const socialPlatforms: SocialPlatform[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: FaFacebookF,
    links: {
      en: socialLinksByLanguage.en[0].href,
      hi: socialLinksByLanguage.hi[0].href,
      te: socialLinksByLanguage.te[0].href,
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: FaInstagram,
    links: {
      en: socialLinksByLanguage.en[1].href,
      hi: socialLinksByLanguage.hi[1].href,
      te: socialLinksByLanguage.te[1].href,
    },
  },
  {
    id: "x",
    name: "X",
    icon: FaXTwitter,
    links: {
      en: socialLinksByLanguage.en[2].href,
    },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: FaLinkedinIn,
    links: {
      en: socialLinksByLanguage.en[3].href,
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: FaYoutube,
    links: {
      en: socialLinksByLanguage.en[4].href,
      hi: socialLinksByLanguage.hi[4].href,
      te: socialLinksByLanguage.te[4].href,
    },
  },
];

const socialLanguageOptions: Array<{
  id: SocialLanguage;
  flag: string;
  label: string;
  languageClass?: string;
}> = [
  { id: "en", flag: "🇬🇧", label: "English" },
  {
    id: "hi",
    flag: "🇮🇳",
    label: "हिन्दी",
    languageClass: "language-native-name--hi",
  },
  {
    id: "te",
    flag: "🇮🇳",
    label: "తెలుగు",
    languageClass: "language-native-name--te",
  },
];

const socialLanguageOrder = socialLanguageOptions.map((option) => option.id);

function availableLanguagesFor(platform: SocialPlatform) {
  return getAvailableSocialLinks(platform.links, socialLanguageOrder);
}

function openSocialLink(url: string) {
  if (!isValidSocialUrl(url)) return;

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) {
    openedWindow.opener = null;
  }
}

function SocialLanguageModal({
  platform,
  onClose,
}: {
  platform: SocialPlatform;
  onClose: () => void;
}) {
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const availableLanguages = availableLanguagesFor(platform);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    firstOptionRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  function selectLanguage(language: SocialLanguage) {
    const selected = availableLanguages.find(
      (option) => option.language === language,
    );
    if (!selected) return;

    openSocialLink(selected.url);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm motion-safe:animate-[social-modal-backdrop-in_180ms_ease-out] sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-language-modal-title"
        aria-describedby="social-language-modal-description"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-cyan-200/70 bg-white text-slate-800 shadow-[0_28px_90px_rgba(2,12,27,0.35)] motion-safe:animate-[social-modal-panel-in_220ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-[#0B4F7A] via-cyan-400 to-[#FF6A3D]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close language selection"
          className="absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[#0B4F7A] hover:text-[#0B4F7A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B4F7A]"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <Image
            src="/images/shrimp-news-logo.png"
            alt="Shrimp News"
            width={150}
            height={68}
            className="h-auto w-[128px] object-contain"
          />

          <h2
            id="social-language-modal-title"
            className="mt-5 pr-12 text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-3xl"
          >
            Choose Your Language
          </h2>
          <p
            id="social-language-modal-description"
            className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base"
          >
            Select the Shrimp.News language channel you want to follow.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {availableLanguages.map((availableLanguage, index) => {
              const option = socialLanguageOptions.find(
                (candidate) => candidate.id === availableLanguage.language,
              );
              if (!option) return null;
              return (
                <button
                  key={option.id}
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="button"
                  onClick={() => selectLanguage(option.id)}
                  className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-[#F7FBFF] px-4 py-5 text-center transition duration-200 hover:-translate-y-1 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-[0_12px_28px_rgba(11,79,122,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B4F7A]"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {option.flag}
                  </span>
                  <span
                    className={`mt-2 text-base font-extrabold text-[#0B3A6E] group-hover:text-[#FF5A36] ${option.languageClass || ""}`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  const [selectedPlatform, setSelectedPlatform] =
    useState<SocialPlatform | null>(null);
  const [unavailableMessage, setUnavailableMessage] = useState("");

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSocialClick(platform: SocialPlatform) {
    const availableLanguages = availableLanguagesFor(platform);

    if (availableLanguages.length === 1) {
      setUnavailableMessage("");
      openSocialLink(availableLanguages[0].url);
      return;
    }

    if (availableLanguages.length > 1) {
      setUnavailableMessage("");
      setSelectedPlatform(platform);
      return;
    }

    setSelectedPlatform(null);
    setUnavailableMessage("This social channel is not available yet.");
  }

  return (
    <footer className="bg-[#071A33] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_1fr] lg:gap-14">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label={`${t("shrimpNews")} home`}
              className="inline-flex"
            >
              <Image
                src="/images/shrimp-news-logo.png"
                alt={t("shrimpNews")}
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
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                const availableCount = availableLanguagesFor(platform).length;

                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleSocialClick(platform)}
                    aria-label={
                      availableCount === 1
                        ? `Open ${t("shrimpNews")} ${platform.name}`
                        : availableCount > 1
                          ? `Choose language for ${t("shrimpNews")} ${platform.name}`
                          : `${t("shrimpNews")} ${platform.name} is unavailable`
                    }
                    className="group flex w-16 flex-col items-center gap-2 border-0 bg-transparent p-0 text-center"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/25 bg-[#0B345B] text-white transition duration-200 group-hover:-translate-y-1 group-hover:border-cyan-300 group-hover:bg-cyan-400 group-hover:text-[#071A33]">
                      <Icon className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
            <p
              aria-live="polite"
              className={`mt-3 text-sm text-amber-200 ${unavailableMessage ? "" : "sr-only"}`}
            >
              {unavailableMessage}
            </p>

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
                href="/about#contact"
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

      {selectedPlatform ? (
        <SocialLanguageModal
          platform={selectedPlatform}
          onClose={() => setSelectedPlatform(null)}
        />
      ) : null}
    </footer>
  );
}
