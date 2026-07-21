"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import type { PublicArticle } from "@/lib/article-types";
import { baseSlug } from "@/lib/public-articles-shared";

export function HeroSection({ featuredArticle }: { featuredArticle?: PublicArticle }) {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-white px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-12">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        {/* Left Content */}
        <div className="space-y-8">
          <div
            className="hero-fade-in flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.38em] text-[#ff6a3d]"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-px w-10 bg-[#ff6a3d]" />
            <span>{t("heroEyebrow")}</span>
            <span className="h-px w-10 bg-[#ff6a3d]" />
          </div>

          <div className="space-y-8">
            <h1
              className="hero-fade-in max-w-[780px] text-[34px] font-black leading-[0.95] tracking-[-0.045em] text-[#0B3A6E] sm:text-[52px] sm:leading-[0.92] sm:tracking-[-0.055em] lg:text-[72px] xl:text-[80px]"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="block">{t("heroTitleStart")}</span>

              <span className="block">
                {t("heroTitleMiddle") ? `${t("heroTitleMiddle")} ` : null}
                <span className="text-[#ff5a2f]">
                  {t("heroTitleHighlight")}
                </span>
                .
              </span>
            </h1>

            <p
              className="hero-fade-in max-w-2xl text-[18px] leading-8 text-slate-600 sm:text-[20px] sm:leading-9"
              style={{ animationDelay: "0.3s" }}
            >
              {t("heroDescription")}
            </p>
          </div>

          <div
            className="hero-fade-in flex flex-wrap gap-5"
            style={{ animationDelay: "0.42s" }}
          >
            <Link
              href={featuredArticle ? `/articles/${baseSlug(featuredArticle.slug)}` : "/articles"}
              className="hero-btn-lift inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500 px-8 py-4 text-base font-semibold text-slate-950 shadow-[0_18px_60px_rgba(255,90,47,0.24)] transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2"
            >
              {t("readLatest")}
            </Link>

            <Link
              href="/articles"
              className="hero-btn-lift inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/80 px-8 py-4 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2"
            >
              {t("exploreArticles")}
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="hero-glow-pulse absolute h-[75%] w-[75%] rounded-full bg-cyan-200/25 blur-[45px]" />

          <div className="hero-image-reveal">
            <div className="hero-image-float relative rounded-[34px] p-[3px]">
              <div className="animated-image-border absolute inset-0 rounded-[34px]" />

              <div className="image-border-glow absolute -inset-[6px] rounded-[40px] opacity-30 blur-md" />

              <div className="relative z-10 overflow-hidden rounded-[31px] bg-[#03172d]">
                <Image
                  src="/images/Shrimp-home.png"
                  alt="Shrimp industry benefits including growth, protein, nutrients, global demand and sustainable aquaculture"
                  width={1200}
                  height={1200}
                  priority
                  sizes="(max-width: 1024px) 85vw, 40vw"
                  className="h-auto w-full max-w-[420px] object-contain transition-transform duration-700 hover:scale-[1.02] sm:max-w-[460px] lg:max-w-[480px] xl:max-w-[500px]"
                />

                <span className="hero-shimmer pointer-events-none absolute inset-0 z-20" />
              </div>

              <span className="corner-light corner-light-one" />
              <span className="corner-light corner-light-two" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hero-fade-in {
          opacity: 0;
          transform: translateY(18px);
          animation: heroFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .hero-image-reveal {
          opacity: 0;
          transform: translateY(14px) scale(0.97);
          animation: heroImageReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1)
            0.2s forwards;
        }

        .hero-image-float {
          animation: heroImageFloat 6s ease-in-out 1.2s infinite;
        }

        .hero-btn-lift {
          transition:
            transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.35s ease;
        }

        .hero-btn-lift:hover {
          transform: translateY(-3px);
        }

        .hero-glow-pulse {
          animation: glowBreathe 6s ease-in-out infinite;
        }

        .animated-image-border {
          background: linear-gradient(
            120deg,
            #00c7e8,
            #0b3a6e,
            #ff5a2f,
            #00c7e8
          );
          background-size: 300% 300%;
          animation: animatedBorder 8s linear infinite;
        }

        .image-border-glow {
          background: linear-gradient(
            120deg,
            rgba(0, 199, 232, 0.55),
            rgba(255, 90, 47, 0.5),
            rgba(11, 58, 110, 0.55)
          );
          background-size: 300% 300%;
          animation: animatedBorder 8s linear infinite;
        }

        .hero-shimmer {
          background: linear-gradient(
            110deg,
            transparent 42%,
            rgba(255, 255, 255, 0.08) 46%,
            rgba(255, 255, 255, 0.34) 50%,
            rgba(255, 255, 255, 0.08) 54%,
            transparent 58%
          );
          transform: translateX(-150%);
          animation: shimmerSweep 2.8s ease-in-out 1.5s forwards;
        }

        .corner-light {
          position: absolute;
          z-index: 20;
          height: 8px;
          width: 8px;
          border-radius: 9999px;
          animation: cornerPulse 3s ease-in-out infinite;
        }

        .corner-light-one {
          left: -2px;
          top: 40px;
          background: rgba(0, 217, 255, 0.85);
          box-shadow:
            0 0 8px rgba(0, 217, 255, 0.6),
            0 0 16px rgba(0, 217, 255, 0.35);
        }

        .corner-light-two {
          right: -2px;
          bottom: 40px;
          animation-delay: 1.5s;
          background: rgba(255, 90, 47, 0.85);
          box-shadow:
            0 0 8px rgba(255, 90, 47, 0.6),
            0 0 16px rgba(255, 90, 47, 0.35);
        }

        @keyframes heroFadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroImageReveal {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes heroImageFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes glowBreathe {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(1);
          }

          50% {
            opacity: 0.7;
            transform: scale(1.04);
          }
        }

        @keyframes animatedBorder {
          0% {
            background-position: 0% 50%;
          }

          50% {
            background-position: 100% 50%;
          }

          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes shimmerSweep {
          from {
            transform: translateX(-150%);
          }

          to {
            transform: translateX(150%);
          }
        }

        @keyframes cornerPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.8);
          }

          50% {
            opacity: 0.9;
            transform: scale(1.1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-fade-in,
          .hero-image-reveal,
          .hero-image-float,
          .hero-glow-pulse,
          .animated-image-border,
          .image-border-glow,
          .hero-shimmer,
          .corner-light {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
