export type EventRegion = "India" | "International";

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  dateLabel: string;
  shortDateLabel: string;
  venue: string;
  locationLabel: string;
  duration: string;
  category: string;
  region: EventRegion;
  audience: string[];
  shortDescription?: string;
  description: string;
  image: string;
  officialWebsite?: string;
};

export const events: EventItem[] = [
  {
    id: "global-shrimp-forum-2026",
    slug: "global-shrimp-forum-2026",
    title: "Global Shrimp Forum 2026",
    date: "2026-09-01",
    endDate: "2026-09-03",
    dateLabel: "1–3 September 2026",
    shortDateLabel: "1–3 Sep 2026",
    venue: "Van der Valk Hotel, Utrecht, Netherlands",
    locationLabel: "Utrecht, Netherlands",
    duration: "3 Days",
    category: "Global Shrimp Conference",
    region: "International",
    audience: [
      "Shrimp Farmers",
      "Exporters",
      "Seafood Companies",
      "Researchers",
      "Investors",
      "Feed Manufacturers",
      "Retailers",
      "Policymakers",
    ],
    description:
      "The Global Shrimp Forum is one of the world's leading events dedicated exclusively to the shrimp industry. It brings together producers, exporters, retailers, researchers, policymakers, and technology providers to discuss global shrimp production, market trends, sustainability, feed innovation, trade, and supply chain developments. The event also features a dedicated Feed Summit on 2 September 2026.",
    image: "/images/events/global-shrimp-forum.jpeg",
    officialWebsite: "https://www.shrimp-forum.com/",
  },
  {
    id: "shrimp-retail-2026",
    slug: "shrimp-retail-2026",
    title: "Shrimp Retail 2026",
    date: "2026-09-29",
    endDate: "2026-09-30",
    dateLabel: "29–30 September 2026",
    shortDateLabel: "29–30 Sep 2026",
    venue:
      "Novotel Vijayawada Varun, Vijayawada, Andhra Pradesh, India",
    locationLabel: "Vijayawada, India",
    duration: "2 Days",
    category: "Domestic Seafood Conference",
    region: "India",
    audience: [
      "Shrimp Farmers",
      "Seafood Retailers",
      "Processors",
      "Exporters",
      "Cold Chain Companies",
      "Technology Providers",
      "Investors",
      "Hospitality Professionals",
      "Policymakers",
    ],
    description:
      "Shrimp Retail 2026 is the 5th edition of India's premier domestic seafood conference, dedicated to accelerating seafood consumption and strengthening the domestic shrimp market. The conference brings together industry leaders, retailers, processors, entrepreneurs, technology providers, and policymakers to discuss innovative strategies for expanding seafood retail, improving cold chain infrastructure, and driving consumption-led growth across India.\n\nThe event serves as a platform for networking, knowledge sharing, business collaborations, and showcasing the latest retail technologies that support the growth of India's seafood industry.",
    image: "/images/events/shrimp-retail.jpeg",
    officialWebsite: "https://shrimpretail.in/",
  },
  {
    id: "responsible-seafood-summit-2026",
    slug: "responsible-seafood-summit-2026",
    title: "Responsible Seafood Summit 2026",
    date: "2026-09-21",
    endDate: "2026-09-24",
    dateLabel: "21–24 September 2026",
    shortDateLabel: "21–24 Sep 2026",
    venue: "Shangri-La Bangkok, Bangkok, Thailand",
    locationLabel: "Bangkok, Thailand",
    duration: "4 Days",
    category: "Seafood Sustainability Summit",
    region: "International",
    audience: [
      "Seafood Producers",
      "Shrimp Farmers",
      "Hatcheries",
      "Exporters",
      "Researchers",
      "NGOs",
      "Certification Bodies",
      "Policymakers",
      "Industry Professionals",
    ],
    description:
      "Organized by the Global Seafood Alliance (GSA), this summit focuses on responsible seafood production and sustainable shrimp farming. Key discussions include breeding, disease management, shrimp welfare, certification, traceability, environmental sustainability, and global market trends.",
    image: "/images/events/responsible-seafood-summit.jpeg",
    officialWebsite:
      "https://www.globalseafood.org/blog/summit-2026-announcement/",
  },
  {
    id: "aquabiz-2026",
    slug: "aquabiz-2026",
    title: "AQUABIZ 2026",
    date: "2026-08-06",
    endDate: "2026-08-08",
    dateLabel: "6–8 August 2026",
    shortDateLabel: "6–8 Aug 2026",
    venue: "Vijayawada, Andhra Pradesh, India",
    locationLabel: "Vijayawada, India",
    duration: "3 Days",
    category:
      "Aquaculture, Shrimp & Marine Economy Conference & Exhibition",
    region: "India",
    audience: [
      "Shrimp Farmers",
      "Seafood Exporters",
      "Technology Providers",
      "Policymakers",
      "Investors",
      "Researchers",
    ],
    description:
      "AQUABIZ 2026 brings together policymakers, exporters, investors, seafood buyers, researchers, and aquaculture companies to discuss India's blue economy, shrimp farming, seafood exports, sustainability, and innovation. The conference is hosted in Andhra Pradesh, India's leading shrimp-producing state.",
    image: "/images/events/aquabiz.jpeg",
  },
  {
    id: "seafood-expo-asia-2026",
    slug: "seafood-expo-asia-2026",
    title: "Seafood Expo Asia 2026",
    date: "2026-09-02",
    endDate: "2026-09-04",
    dateLabel: "2–4 September 2026",
    shortDateLabel: "2–4 Sep 2026",
    venue: "Singapore",
    locationLabel: "Singapore",
    duration: "3 Days",
    category: "Seafood Trade Exhibition",
    region: "International",
    audience: [
      "Seafood Importers",
      "Exporters",
      "Buyers",
      "Retail Chains",
      "Food Service Companies",
      "Seafood Processors",
    ],
    description:
      "Seafood Expo Asia is one of Asia's leading seafood trade exhibitions, bringing together suppliers, buyers, distributors, processors, and retailers from across the region. The event showcases fresh, frozen, processed, and value-added seafood products while creating opportunities for international trade, sourcing, networking, and business partnerships.",
    image: "/images/events/seafood-expo-asia.jpeg",
    officialWebsite: "https://www.seafoodexpo.com/asia/",
  },
];
