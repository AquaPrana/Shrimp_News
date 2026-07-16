"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LanguageSelector } from "@/components/layout/language-selector";
import { useLanguage } from "@/context/language-context";

export function SiteHeader() {
  const router = useRouter();
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function openAquaGPT() {
    setOpen(false);
    router.push("/ask-aquaprana");
  }

  return (
    <header
      className={`sticky top-0 z-[60] w-full overflow-visible transition-all duration-300 ${
        scrolled
          ? "border-b border-[#E5E7EB] bg-white/95 shadow-[0_6px_24px_rgba(15,23,42,0.09)] backdrop-blur-xl"
          : "border-b border-[#E5E7EB] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
      }`}
    >
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1600px] items-center gap-3 overflow-visible px-3 sm:min-h-[72px] sm:gap-5 sm:px-6 lg:min-h-[82px] lg:gap-7 lg:px-8">
        <Link
          href="/"
          aria-label="Shrimp News home"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/images/shrimp-news-logo.png"
            alt="Shrimp News"
            width={210}
            height={95}
            priority
            className="h-auto w-[118px] object-contain sm:w-[150px] xl:w-[168px]"
          />
        </Link>

        <button
          type="button"
          onClick={openAquaGPT}
          aria-label={t("askAquaGPTButton")}
          className="group ml-3 hidden h-12 w-[320px] shrink-0 items-center gap-2.5 rounded-full border border-[#CBD5E1] bg-white px-2.5 text-left shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition duration-300 hover:border-[#3F475A] hover:shadow-[0_7px_20px_rgba(63,71,90,0.15)] xl:ml-6 xl:flex 2xl:w-[360px]"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] p-1">
            <Image
              src="/images/aquagpt-logo.png"
              alt="AquaGPT"
              width={30}
              height={30}
              className="h-7 w-7 object-contain"
            />
          </span>

          <span className="min-w-0 flex-1 truncate text-sm text-[#64748B] transition group-hover:text-[#1E3A5F]">
            {t("askAquaGPTShort")}
          </span>

          <span className="shrink-0 rounded-full bg-[#3F475A] px-4 py-2 text-sm font-semibold text-white transition duration-300 group-hover:bg-[#2E3444]">
            {t("ask")}
          </span>
        </button>

        <div className="relative z-[70] hidden min-w-0 flex-1 items-center justify-center overflow-visible lg:flex">
          <Suspense fallback={null}>
            <DesktopNav />
          </Suspense>
        </div>

        <div className="relative z-[80] hidden shrink-0 lg:block">
          <LanguageSelector />
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={t("toggleNavigation")}
          aria-expanded={open}
          className="ml-auto inline-flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white text-[#1E3A5F] transition duration-300 hover:border-[#3F475A] hover:bg-[#F8FAFC] hover:text-[#3F475A] lg:hidden"
        >
          <span
            className={`block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />

          <span
            className={`block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />

          <span
            className={`block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
              open ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[#E5E7EB] bg-white px-3 py-2 sm:px-6 xl:hidden">
        <button
          type="button"
          onClick={openAquaGPT}
          aria-label={t("askAquaGPTButton")}
          className="group mx-auto flex w-full max-w-3xl min-w-0 items-center gap-2.5 rounded-full border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-left shadow-[0_3px_12px_rgba(15,23,42,0.05)] transition duration-300 hover:border-[#3F475A] hover:shadow-[0_5px_16px_rgba(63,71,90,0.12)]"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] p-1">
            <Image
              src="/images/aquagpt-logo.png"
              alt="AquaGPT"
              width={30}
              height={30}
              className="h-7 w-7 object-contain"
            />
          </span>

          <span className="min-w-0 flex-1 truncate text-sm text-[#64748B] transition group-hover:text-[#1E3A5F]">
            {t("askAquaGPTShort")}
          </span>

          <span className="shrink-0 rounded-full bg-[#3F475A] px-4 py-2 text-sm font-semibold text-white transition duration-300 group-hover:bg-[#2E3444]">
            {t("ask")}
          </span>
        </button>
      </div>

      <Suspense fallback={null}>
        <MobileNav open={open} onClose={() => setOpen(false)} />
      </Suspense>
    </header>
  );
}