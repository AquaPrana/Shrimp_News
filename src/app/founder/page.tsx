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
      "Indu Vardhan Reddy is a dynamic entrepreneur, strategic thinker, and the visionary force behind Shrimp.News — India’s dedicated media and technology platform for aquaculture, shrimp farming, fisheries, and seafood markets.",
      "Originating from Nellore, Andhra Pradesh, Indu Vardhan’s entrepreneurial journey spans more than fifteen years and multiple industries, including hospitality, film production, exports, and real estate. His ability to identify untapped opportunities has made him a serial innovator with a strong record of transforming bold ideas into impactful ventures.",
      "He completed his management education in Chennai and gained corporate experience working with large organisations. This experience laid the foundation for his strategic, market-focused, and growth-driven approach.",
      "At Shrimp.News, Indu Vardhan is redefining how the aquaculture and fisheries ecosystem communicates, collaborates, and evolves. The platform serves as a central hub for industry news, knowledge sharing, branding, market intelligence, and strategic partnerships.",
      "His leadership is guided by a commitment to sustainability, innovation, farmer empowerment, and practical market solutions. His vision extends beyond national boundaries, with a strategic roadmap to establish Shrimp.News as a trusted global voice in the blue economy.",
    ],
    quote:
      "I enjoy the arcs of life — I don’t like it to be a flat line.",
    quoteAuthor: "Indu Vardhan Reddy",
  },
  {
    role: "Co-Founder & COO",
    name: "Suryateja Vemavarapu",
    image: "/images/founders/surya-sir.jpg",
    imageAlt: "Suryateja Vemavarapu, Co-Founder and COO of Shrimp News",
    imagePosition: "left",
    paragraphs: [
      "Suryateja Vemavarapu is the Co-Founder and Chief Operating Officer of Shrimp.News, a next-generation media platform reshaping the aquaculture and fisheries landscape through powerful storytelling, ground-level insight, and scalable digital reach.",
      "His media journey began with international media organisations, where he explored the dynamics of global content creation and cross-cultural communication. He later worked with respected media houses in Hyderabad, building a strong foundation in broadcasting, digital content, audience engagement, and media operations.",
      "Today, Surya brings that sharp media understanding into the aquaculture sector. At Shrimp.News, he drives high-impact initiatives, multilingual content platforms, business partnerships, digital strategy, and farmer-focused communication.",
      "With one foot in global strategy and the other in grassroots reality, Surya’s leadership blends creativity, operational clarity, regional relevance, and community-driven growth.",
      "He believes that technology, trustworthy journalism, and content delivered in regional languages can make aquaculture information more accessible and help strengthen the entire seafood ecosystem.",
    ],
    quote:
      "Marketing isn’t just about selling — it’s about delivering the right story, through the right systems, to the right people, in the language of the water they live by.",
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
