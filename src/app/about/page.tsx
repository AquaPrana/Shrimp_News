"use client";

import Image from "next/image";
import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import {
  useLanguage,
  type Language,
} from "@/context/language-context";

const EDITORIAL_EMAIL = "editor@shrimp.news";
const CONTACT_PHONE = "+91 7075527682";

const sectionLabels: Record<
  Language,
  {
    foundersMessage: string;
    coFoundersMessage: string;
    founderRole: string;
    coFounderRole: string;
  }
> = {
  en: {
    foundersMessage: "Founder's Message",
    coFoundersMessage: "Co-Founder's Message",
    founderRole: "Founder & CEO",
    coFounderRole: "Co-Founder & COO",
  },
  te: {
    foundersMessage: "వ్యవస్థాపకుడి సందేశం",
    coFoundersMessage: "సహ వ్యవస్థాపకుడి సందేశం",
    founderRole: "వ్యవస్థాపకుడు & CEO",
    coFounderRole: "సహ వ్యవస్థాపకుడు & COO",
  },
  hi: {
    foundersMessage: "संस्थापक का संदेश",
    coFoundersMessage: "सह-संस्थापक का संदेश",
    founderRole: "संस्थापक और CEO",
    coFounderRole: "सह-संस्थापक और COO",
  },
};

const founders = [
  {
    name: "Indu Vardhan Reddy",
    image: "/images/founders/iv-sir.jpg",
    imageAlt: "Indu Vardhan Reddy, Founder and CEO of Shrimp News",
    imagePosition: "right",
    paragraphs: [
      "India has become one of the world's leading shrimp-producing nations. Every year, Indian shrimp reaches dining tables across continents, creating livelihoods for millions of people connected with the shrimp value chain.",
      "Yet one important question inspired the creation of Shrimp.News:",
      "Why is there no dedicated global platform that brings the entire shrimp ecosystem together?",
      "Shrimp.News was created to answer that question.",
      "Our vision goes beyond publishing news. We aim to build a knowledge platform that informs, educates, connects, and inspires everyone associated with the shrimp industry.",
      "We believe knowledge is the strongest foundation for growth.",
      "Whether it is a farmer looking for better farming practices, a processor tracking market trends, a researcher sharing scientific discoveries, or a consumer learning about the health benefits of shrimp, everyone deserves access to reliable information presented in a simple and practical way.",
      "We also believe India's next opportunity lies not only in producing shrimp for the world but also in encouraging more Indians to consume it. A stronger domestic market will support farmers, retailers, processors, and consumers while creating a more resilient shrimp industry.",
      "Shrimp.News is our commitment to building a platform that connects local knowledge with global opportunities.",
      "Thank you for being part of this journey.",
    ],
    quote:
      "Together, let us build a stronger, smarter, and more connected global shrimp community.",
  },
  {
    name: "Suryateja Vemavarapu",
    image: "/images/founders/surya-sir.jpg",
    imageAlt: "Suryateja Vemavarapu, Co-Founder and COO of Shrimp News",
    imagePosition: "left",
    paragraphs: [
      "The shrimp industry is evolving rapidly, driven by innovation, technology, sustainability, and changing market dynamics. As the industry grows, so does the need for reliable information that helps stakeholders make informed decisions and stay ahead of change.",
      "At Shrimp.News, our commitment is to build more than a news platform. We are creating a trusted knowledge ecosystem that connects the global shrimp community through credible journalism, practical insights, and meaningful collaboration.",
      "Every article, market update, research summary, and industry story we publish is intended to create value for farmers, businesses, researchers, policymakers, and consumers alike. We believe that informed decisions lead to stronger businesses, sustainable farming practices, and a more resilient shrimp industry.",
      "Our journey is only beginning, and we look forward to working alongside industry leaders, innovators, and professionals to shape the future of global shrimp aquaculture.",
      "Thank you for being part of Shrimp.News.",
    ],
    quote:
      "Together, we can build a more informed, connected, and progressive shrimp industry.",
  },
] as const;

type Founder = (typeof founders)[number];

function FounderSection({
  founder,
  heading,
  role,
  priority = false,
}: {
  founder: Founder;
  heading: string;
  role: string;
  priority?: boolean;
}) {
  const imageFirst = founder.imagePosition === "left";

  const contentCard = (
    <div className="flex h-full flex-col justify-center bg-[#e8e6f2] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {role}
      </p>

      <h3 className="mt-4 text-3xl font-extrabold uppercase leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]">
        {founder.name}
      </h3>

      <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-800 sm:text-base sm:leading-8">
        {founder.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );

  const imageColumn = (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[360px] flex-1 overflow-hidden bg-slate-100 sm:min-h-[420px] lg:min-h-0">
        <Image
          src={founder.image}
          alt={founder.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center"
          priority={priority}
        />
      </div>

      <blockquote className="bg-white px-1 pt-4 pb-1 sm:pt-5">
        <p className="text-[15px] italic leading-7 text-slate-600">
          “{founder.quote}”
        </p>
        <footer className="mt-2 text-sm text-slate-700">
          — {founder.name}
        </footer>
      </blockquote>
    </div>
  );

  return (
    <section
      id={priority ? "founders-message" : "co-founders-message"}
      className="scroll-mt-32"
    >
      <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-3xl">
        {heading}
      </h2>

      <div className="grid overflow-hidden lg:grid-cols-2 lg:items-stretch">
        {imageFirst ? (
          <>
            {imageColumn}
            {contentCard}
          </>
        ) : (
          <>
            {contentCard}
            {imageColumn}
          </>
        )}
      </div>
    </section>
  );
}

export default function AboutPage() {
  const { language, t } = useLanguage();
  const labels = sectionLabels[language];
  const aboutParagraphs = t("aboutBody")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <PageShell
      eyebrowKey="aboutEyebrow"
      titleKey="aboutTitle"
      descriptionKey="aboutDescription"
    >
      <div className="space-y-16 sm:space-y-20">
        <section id="about-us" className="scroll-mt-32">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-3xl">
            {t("aboutUs")}
          </h2>

          <div className={PAGE_CONTENT_PANEL_CLASS}>
            {aboutParagraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 whitespace-pre-line last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <FounderSection
          founder={founders[0]}
          heading={labels.foundersMessage}
          role={labels.founderRole}
          priority
        />

        <FounderSection
          founder={founders[1]}
          heading={labels.coFoundersMessage}
          role={labels.coFounderRole}
        />

        <section id="contact" className="scroll-mt-32">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-3xl">
            {t("contactUs")}
          </h2>
          <p className="mt-3 mb-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            {t("contactDescription")}
          </p>

          <div className={PAGE_CONTENT_PANEL_CLASS}>
            <p className="mb-4">{t("contactGeneralEnquiries")}</p>
            <p className="mb-4">
              {t("contactEditorialLabel")}:{" "}
              <a
                href={`mailto:${EDITORIAL_EMAIL}`}
                className="underline underline-offset-2"
              >
                {EDITORIAL_EMAIL}
              </a>
            </p>
            <p className="mb-4">
              Phone:{" "}
              <a
                href="tel:+917075527682"
                className="underline underline-offset-2"
              >
                {CONTACT_PHONE}
              </a>
            </p>
            <p className="mb-0">{t("contactClosing")}</p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
