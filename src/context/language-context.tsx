"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
export type Language = "en";

type LanguageContextValue = {
  language: Language;
  t: (key: CopyKey) => string;
};

const copy = {
  en: {
    home: "Home",
    news: "News",
    topics: "Topics",
    about: "About",
    national: "India",
    international: "Global",
    india: "India",
    global: "Global",
    articles: "Articles",
    shrimpFarming: "Shrimp Farming",
    shrimpPrices: "Shrimp Prices",
    shrimpHealth: "Shrimp Health",
    technologyEquipment: "Technology & Equipment",
    researchInnovations: "Research & Innovations",
    domesticConsumption: "Domestic Consumption",
    marketsIndustry: "Markets & Industry",
    aboutUs: "About Us",
    foundersMessage: "Founder's Message",
    contactUs: "Contact Us",
    askPrana: "Ask Prana about shrimp farming",
    askPranaShort: "Ask Prana...",
    askPranaButton: "Ask Prana",
    ask: "Ask",
    artificialIntelligence: "AI",
    aiAssistant: "AI Assistant",
    shrimpNews: "Shrimp News",
    shrimpNewsPlain: "Shrimp News",
    lastUpdated: "LAST UPDATED",
    online: "Online",
    askPranaAiAssistant: "Ask Prana - AI Assistant",
    askPranaNoResponse: "No response received.",
    askPranaUnableAnswer: "Ask Prana could not answer right now.",
    askPranaPreparingAnswer: "Ask Prana is preparing your answer...",
    askPranaPlaceholder: "Ask about your pond, disease, feed, prices...",
    askPranaIntro:
      "Namaste! I'm Ask Prana — ask me anything about shrimp farming, water quality, disease, feed, or markets.",
    closeAskPrana: "Close Ask Prana",
    primaryNavigation: "Primary navigation",
    toggleNavigation: "Toggle navigation",
    noArticlesFound: "No articles found for this topic yet.",
    relatedArticles: "Related Articles",

    heroEyebrow: "India-first · Globally aware",
    heroTitleStart: "The pulse of",
    heroTitleMiddle: "global",
    heroTitleHighlight: "shrimp",
    heroDescription:
      "News, shrimp prices, market intelligence, farming insights and practical knowledge for the people who grow, trade and consume shrimp.",
    readLatest: "Read the latest",
    exploreArticles: "Explore articles",

    latestArticles: "Latest Articles",
    latestTitle: "Shrimp intelligence for every part of the chain.",
    latestDescription:
      "Current articles from domestic consumption to pricing, health, and market stability.",
    viewAll: "View all",
    recent: "Recent",
    popular: "Popular",
    featured: "Featured",
    welcomeTitle: "Welcome to {shrimpNews}",
    welcomeToShrimpNews: "Welcome to Shrimp News",
    welcomeDescription:
      "Your trusted source for shrimp industry news, markets, farming, health and innovation.",
    loadingArticles: "Loading articles…",
    mainCategoryLabel: "Main news category",
    subcategoryLabel: "Subcategory",
    brandName: "{shrimpNews}",

    domesticTitle: "India's shrimp future starts at home.",
    domesticDescription:
      "Domestic demand is the highest priority for Shrimp.News. We highlight why eating shrimp in India supports farmers, families, and a resilient food economy.",
    whyConsumptionLags: "Why consumption lags",
    healthNutritionStories: "Health and nutrition stories",

    marketsLabel: "Shrimp Markets & Prices",
    marketsTitle: "Market insight designed for industry leaders.",
    marketsDescription:
      "Pricing, export demand, and market balance are critical for farmgate profitability and long-term confidence across the shrimp supply chain.",
    farmgatePriceDrivers: "Farmgate price drivers",
    exportVsDomestic: "Export vs domestic stability",

    farmingHealthLabel: "Shrimp Farming & Health",
    farmingTitle: "Practical insight for farms, feed, and biosecurity.",
    farmingDescription:
      "Articles on nutrition, disease prevention, farming best practices, and the science behind healthier shrimp production.",

    liveMarketIntel: "Live market intelligence",
    marketsAtGlance: "Shrimp markets at a glance",
    liveDashboard: "Live dashboard",
    live: "Live",
    thisWeek: "/kg · this week",
    indiaExportsYtd: "India Exports YTD",
    indiaExportsDesc: "vs same period 2025",
    globalVannamei: "Global Vannamei Index",
    globalVannameiDesc: "US$/kg · 12-week high",
    ecuadorBenchmark: "Ecuador Benchmark",
    ecuadorBenchmarkDesc: "sets the global floor",
    feedCost: "Feed Cost",
    feedCostDesc: "easing for a 3rd week",
    newsExport: "US shipments rebound 12% QoQ as tariff fears cool",
    newsDisease: "Farm alerts remain stable across key coastal belts",
    newsFeed: "Feed prices ease for the third consecutive week",

    readFeaturedStory: "Read featured story",
    readArticle: "Read Article",
    imagePlaceholder: "Image placeholder",

    aquaGptEyebrow: "Ask Prana",
    aquaGptTitle: "Ask Prana - AI Assistant",
    aquaGptDescription:
      "Ask about shrimp farming, water quality, prices, markets, health, and technology. This assistant helps you explore trusted insights while keeping the scope focused on aquaculture.",
    aquaGptOnline: "Online",
    aquaGptPlaceholder: "e.g. What drives shrimp prices in India?",
    aquaGptEmpty: "Please enter a shrimp-related question to get started.",
    aquaGptMockPrefix:
      "Ask Prana suggests reading related shrimp articles and checking industry best practices. This is a mock response for:",
    aquaPrompt1: "What affects shrimp farmgate prices?",
    aquaPrompt2: "How to prevent shrimp disease in ponds?",
    aquaPrompt3: "Best shrimp feed practices for India",

    newsletterEyebrow: "{shrimpNews} Brief",
    newsletterTitle: "The Shrimp Brief",
    newsletterDescription:
      "Prices, disease alerts, policy updates and market intelligence — delivered every Monday. Free forever.",
    newsletterMondayNote:
      "You'll receive the Shrimp Brief every Monday — free forever.",
    newsletterEmailLabel: "Email address",
    newsletterEmailPlaceholder: "you@company.com",
    newsletterSubscribe: "Subscribe free",
    newsletterSubscribing: "Subscribing...",
    newsletterEmptyError: "Please enter a valid email address.",
    newsletterInvalidError: "Please enter a valid email address.",
    newsletterAlreadySubscribed: "This email is already subscribed.",
    newsletterRateLimitError: "Too many attempts. Please try again later.",
    newsletterSubmitError: "Something went wrong. Please try again.",
    newsletterSuccessPrefix: "Thanks for subscribing!",
    newsletterSuccessSuffix: "",
    articlesLoadError: "Articles are temporarily unavailable. Please try again.",
    askPranaThinking: "Ask Prana is thinking...",

    footerTagline:
      "{shrimpNews} delivers market prices, farming intelligence, disease updates, technology insights and industry news for the global shrimp ecosystem.",
    footerSubTagline: "From India's farms to global markets.",
    categories: "Categories",
    latestNews: "Latest News",
    aquaticHealth: "Aquatic Health",
    researchInnovation: "Research & Innovation",
    prices: "Prices",
    followShrimpNews: "Follow {shrimpNews}",
    allRightsReserved: "© 2026 {shrimpNews}. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    terms: "Terms",
    disclaimer: "Disclaimer",
    contact: "Contact",
    ventureLine: "A Fishery News venture · Connecting Aquaculture, Enabling Innovation",
    backToTop: "Back to top",

    pageComingSoon: "Content for this section will be added soon.",

    aboutEyebrow: "About Us",
    aboutTitle: "About {shrimpNews}",
    aboutDescription:
      "India's first dedicated digital media platform built exclusively for the global shrimp industry.",
    aboutBody:
      "Shrimp.News is India's first dedicated digital media platform built exclusively for the global shrimp industry.\n\nOur purpose is simple—to create one trusted platform where every stakeholder in the shrimp ecosystem can access reliable information, practical knowledge, market intelligence, and industry insights.\n\nWe bring together the latest news, long-form industry analysis, shrimp farming practices, disease and health management, domestic and international market intelligence, pricing updates, policy developments, technology innovations, research summaries, and consumer awareness—all in one place.\n\nBeyond reporting news, our mission is to build knowledge. One of our key priorities is promoting domestic shrimp consumption in India.\n\nOur Vision\nTo become the world's most trusted shrimp knowledge and media platform by delivering reliable information, connecting the global shrimp ecosystem, promoting innovation, strengthening domestic shrimp consumption, and empowering every stakeholder through knowledge.\n\nOur Mission\nDeliver credible, accurate, and timely information across the global shrimp industry. Connect farmers, businesses, researchers, policymakers, retailers, exporters, and consumers through one dedicated platform. Promote domestic shrimp consumption by creating awareness about shrimp's nutritional, economic, and social value.",

    pricesEyebrow: "Shrimp Prices",
    pricesTitle: "Vannamei Shrimp Farmgate Prices",
    pricesDescription:
      "Shrimp.News brings you the latest Vannamei shrimp farmgate prices to help farmers, traders, processors, and buyers stay informed about current market rates. The prices below are based on the market update for 15 July 2026 and are intended for informational purposes.",
    pricesBody:
      "Shrimp prices influence every decision across the shrimp value chain—from stocking and harvesting to procurement and trading. Prices vary based on shrimp count, seasonal harvests, demand, and market conditions.\n\nWhat You'll Find\nFarmgate shrimp prices across major shrimp-producing states in India\nPrice updates by shrimp count and size\nWeekly market trends and analysis\nSeasonal price movements\nHarvest and procurement insights",

    farmingEyebrow: "Shrimp Farming",
    farmingPageTitle: "Practical guidance for shrimp producers",
    farmingPageDescription:
      "Pond preparation, stocking, feed, water quality, harvest management, and best farming practices.",
    farmingBody:
      "Successful shrimp farming depends on disciplined pond management, healthy seed, consistent feeding, biosecurity, and timely harvest decisions. Explore the farming articles below for practical, science-based guidance.",

    domesticEyebrow: "Domestic Consumption",
    domesticPageTitle: "Building a Stronger Market for Indian Shrimp",
    domesticPageDescription:
      "India is one of the world's largest shrimp producers and exporters, yet domestic shrimp consumption remains comparatively low.",
    domesticBody:
      "At Shrimp.News, we believe increasing domestic shrimp consumption is one of the greatest opportunities for India's shrimp industry.\n\nA stronger domestic market creates value for farmers, processors, retailers, and consumers while reducing dependence on export markets.\n\nThrough educational articles, nutrition awareness, consumer guides, and industry insights, Shrimp.News helps more Indian households understand, purchase, cook, and enjoy shrimp with confidence.",

    marketsEyebrow: "Markets & Industry",
    marketsPageTitle: "Understanding the Trends Shaping the Shrimp Industry",
    marketsPageDescription:
      "Market conditions, trade, policy, investments, technology, and industry developments that shape farming and exports.",
    marketsBody:
      "Shrimp.News delivers timely market intelligence and industry insights to help stakeholders understand not only what is happening, but why it matters and how it impacts the shrimp ecosystem.\n\nWhat You'll Find\nIndustry news and business updates\nExport and trade developments\nGovernment policies and regulations\nProcessing and value-added industry updates\nTechnology, investments, sustainability, and certification",

    healthEyebrow: "Shrimp Health",
    healthTitle: "Healthy Shrimp. Healthy Farms. Better Profits.",
    healthDescription:
      "Practical, science-based information on shrimp health, disease prevention, biosecurity, and water quality management.",
    healthBody:
      "Healthy shrimp are the foundation of successful shrimp farming. Disease outbreaks can significantly impact survival, production, and profitability.\n\nWhat You'll Find\nDisease identification and management\nEHP, WSSV, AHPND/EMS, Vibrio, and other major diseases\nBiosecurity protocols\nWater quality management\nEarly warning signs and diagnostics\nPractical farm management guides",

    techEyebrow: "Technology",
    techTitle: "Innovation and aquaculture technology",
    techDescription:
      "AI, water monitoring, sensors, automation, precision farming, and digital farm management.",
    techBody:
      "Technology is making shrimp farming smarter. From sensors and automation to AI-assisted decisions, explore research and equipment insights shaping the next decade of aquaculture.",

    articlesEyebrow: "Articles",
    articlesTitle: "First 20 Launch Articles",
    articlesDescription:
      "A polished launch archive of editorial stories, market insight, and shrimp intelligence built to match the rest of the site experience.",
    newsIndiaTitle: "Stay Updated with India's Shrimp Industry",
    newsIndiaDescription:
      "Shrimp.News brings you the latest news and developments from across India's shrimp sector. From government policies and farming updates to disease alerts, research, investments, and industry initiatives, our national coverage keeps you informed about the stories shaping Indian shrimp farming and aquaculture.",
    newsGlobalTitle: "Global Developments That Matter",
    newsGlobalDescription:
      "The global shrimp industry is constantly evolving. Shrimp.News covers international developments, including market trends, trade, technology, research, sustainability, and policy updates from major shrimp-producing and consuming countries, helping you stay connected to the global shrimp ecosystem.",
    articleDetailEyebrow: "Article",
    articleDetailTitle: "Article details",
    articleDetailDescription: "Full editorial story from the Shrimp.News launch archive.",
    articleDetailBody: "Article content",

    founderEyebrow: "Founder's Message",
    founderTitle: "A message from the founder",
    founderDescription:
      "Why Shrimp.News was created and the vision for India's shrimp ecosystem.",
    founderBody:
      "India has become one of the world's leading shrimp-producing nations. Every year, Indian shrimp reaches dining tables across continents, creating livelihoods for millions of people connected with the shrimp value chain.\n\nYet one important question inspired the creation of Shrimp.News: Why is there no dedicated global platform that brings the entire shrimp ecosystem together?\n\nShrimp.News was created to answer that question.\n\nOur vision goes beyond publishing news. We aim to build a knowledge platform that informs, educates, connects, and inspires everyone associated with the shrimp industry.\n\nWe also believe India's next opportunity lies not only in producing shrimp for the world but also in encouraging more Indians to consume it. A stronger domestic market will support farmers, retailers, processors, and consumers while creating a more resilient shrimp industry.\n\nThank you for being part of this journey. Together, let us build a stronger, smarter, and more connected global shrimp community.",

    contactEyebrow: "Contact Us",
    contactTitle: "Get in touch",
    contactDescription:
      "Editorial, business, and partnership enquiries for Shrimp.News.",
    contactGeneralEnquiries: "General Enquiries",
    contactEditorialLabel: "Editorial",
    contactBusinessLabel: "Business",
    contactClosing:
      "We welcome editorial ideas, partnerships, advertising inquiries, and story submissions connected to the global shrimp industry.",

    askPageEyebrow: "Ask Prana",
    askPageTitle: "Ask a focused shrimp intelligence assistant",
    askPageDescription:
      "This experience is being prepared to support shrimp farming, pricing, health, and editorial questions within a safe scope.",
    askPageBody:
      "The Ask Prana experience will be implemented once the content and interaction model are finalized.",

    privacyEyebrow: "Privacy Policy",
    privacyTitle: "Privacy Policy",
    privacyDescription:
      "How Shrimp.News collects, uses, and protects your personal information.",
    privacyP1:
      "Shrimp.News respects your privacy and is committed to protecting your personal information.",
    privacyP2:
      "Information collected through our website, including contact forms, newsletter subscriptions, cookies, and user interactions, is used solely to improve our services, communicate with our audience, and enhance user experience.",
    privacyP3:
      "We do not sell, rent, or share personal information with third parties except where required by law or necessary to operate our services.",
    privacyP4:
      "By accessing and using Shrimp.News, you consent to the collection and use of information in accordance with this Privacy Policy.",
    privacyP5:
      "This Privacy Policy may be updated periodically without prior notice.",

    termsEyebrow: "Terms & Conditions",
    termsTitle: "Terms & Conditions",
    termsDescription:
      "The rules that apply when you access and use Shrimp.News.",
    termsP1:
      "By accessing and using Shrimp.News, you agree to comply with these Terms and Conditions.",
    termsP2:
      "All content published on Shrimp.News, including articles, images, graphics, videos, reports, and other materials, is protected by applicable intellectual property laws.",
    termsP3:
      "Content may be shared for personal and non-commercial purposes with appropriate attribution. Reproduction, modification, or commercial use without prior written permission is prohibited.",
    termsP4:
      "The information published on Shrimp.News is intended for educational, informational, and industry awareness purposes.",
    termsP5:
      "Shrimp.News reserves the right to modify website content, services, and these Terms & Conditions at any time without prior notice.",
    termsP6:
      "Continued use of the website constitutes acceptance of the latest version of these Terms.",

    disclaimerEyebrow: "Disclaimer",
    disclaimerTitle: "Disclaimer",
    disclaimerDescription:
      "Important limitations about the information published on Shrimp.News.",
    disclaimerP1:
      "The information available on Shrimp.News is provided for educational, informational, and industry awareness purposes only.",
    disclaimerP2:
      "While every effort is made to ensure the accuracy and reliability of published content, Shrimp.News does not guarantee that all information is complete, current, or free from errors.",
    disclaimerP3:
      "Articles covering shrimp farming, disease management, water quality, nutrition, markets, pricing, technology, exports, and policy should not be considered professional veterinary, financial, legal, investment, or regulatory advice.",
    disclaimerP4:
      "Readers are encouraged to consult qualified professionals before making farming, business, financial, or management decisions.",
    disclaimerP5:
      "Shrimp.News, its publishers, editors, and contributors shall not be held responsible for any direct or indirect loss arising from the use of information published on this website.",

    askPranaHelpTitle: "How can Ask Prana help?",
    askPranaHelpDescription:
      "Ask about farming, pond health, feed, water quality, disease or shrimp markets.",

  },
} as const;

export type CopyKey = keyof typeof copy.en;

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  // English is the global standard language — ignore stored TE/HI preferences.
  void initialLanguage;
  const language: Language = "en";

  const t = useCallback((key: CopyKey) => {
    const value = copy.en[key];
    if (value == null || value === "") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[copy] Missing key: ${String(key)}`);
      }
      return "";
    }
    if (typeof value !== "string") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[copy] Invalid value for key: ${String(key)}`);
      }
      return "";
    }
    if (key !== "shrimpNews" && value.includes("{shrimpNews}")) {
      return value.replaceAll("{shrimpNews}", copy.en.shrimpNews);
    }
    return value;
  }, []);

  const value = useMemo(
    () => ({
      language,
      t,
    }),
    [language, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider",
    );
  }

  return context;
}
