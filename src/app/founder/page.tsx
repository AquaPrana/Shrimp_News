import Image from "next/image";
import Link from "next/link";

const founders = [
  {
    role: "Founder & CEO",
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
    quoteAuthor: "Indu Vardhan Reddy",
  },
  {
    role: "Co-Founder & COO",
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
    quoteAuthor: "Suryateja Vemavarapu",
  },
];

type Founder = (typeof founders)[number];

function FounderSection({ founder }: { founder: Founder }) {
  const imageFirst = founder.imagePosition === "left";

  const contentCard = (
    <div className="flex h-full flex-col justify-center bg-[#e8e6f2] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {founder.role}
      </p>

      <h2 className="mt-4 text-3xl font-extrabold uppercase leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[42px]">
        {founder.name}
      </h2>

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
          priority={founder.role === "Founder & CEO"}
        />
      </div>

      <blockquote className="bg-white px-1 pt-4 pb-1 sm:pt-5">
        <p className="text-[15px] italic leading-7 text-slate-600">
          “{founder.quote}”
        </p>
        <footer className="mt-2 text-sm text-slate-700">
          — {founder.quoteAuthor}
        </footer>
      </blockquote>
    </div>
  );

  return (
    <section>
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

export default function FounderPage() {
  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-500">
            Leadership
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B3A6E] sm:text-4xl">
            Meet the people behind Shrimp.News
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Building a trusted, multilingual, and technology-driven media
            platform for shrimp farming, aquaculture, fisheries, and the global
            seafood industry.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:space-y-20 sm:px-6 sm:py-14">
        {founders.map((founder) => (
          <FounderSection key={founder.name} founder={founder} />
        ))}

        <section className="border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
                Shrimp.News
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#0B3A6E] sm:text-2xl">
                Connecting the global aquaculture community
              </h2>
            </div>

            <Link
              href="/contact"
              className="inline-flex w-fit items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Contact our team
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
