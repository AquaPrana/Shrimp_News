"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Language = "en" | "te" | "hi";

const LANGUAGE_STORAGE_KEY = "shrimp-news-language";
const LANGUAGE_CHANGE_EVENT = "shrimp-news-language-change";

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "te" || value === "hi";
}

function getStoredLanguage(): Language {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(savedLanguage) ? savedLanguage : "en";
}

function subscribeToLanguage(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLocalChange);
  };
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const translations = {
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
    readArticle: "Read article →",
    imagePlaceholder: "Image placeholder",

    aquaGptEyebrow: "Ask Prana",
    aquaGptTitle: "Aquaculture-only AI assistant",
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

    newsletterEyebrow: "Shrimp News Brief",
    newsletterTitle: "The Shrimp Brief",
    newsletterDescription:
      "Prices, disease alerts, policy updates and market intelligence — delivered every Monday. Free forever.",
    newsletterMondayNote:
      "You'll receive the Shrimp Brief every Monday — free forever.",
    newsletterEmailLabel: "Email address",
    newsletterSubscribe: "Subscribe free",
    newsletterEmptyError: "Please enter your email address.",
    newsletterInvalidError: "Please enter a valid email address.",
    newsletterSuccessPrefix: "Thank you for subscribing to the Shrimp Brief.",
    newsletterSuccessSuffix: "",

    footerTagline:
      "Shrimp News delivers market prices, farming intelligence, disease updates, technology insights and industry news for the global shrimp ecosystem.",
    footerSubTagline: "From India's farms to global markets.",
    categories: "Categories",
    latestNews: "Latest News",
    aquaticHealth: "Aquatic Health",
    researchInnovation: "Research & Innovation",
    prices: "Prices",
    followShrimpNews: "Follow Shrimp News",
    allRightsReserved: "© 2026 Shrimp News. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    terms: "Terms",
    disclaimer: "Disclaimer",
    contact: "Contact",
    ventureLine: "A Fishery News venture · Connecting Aquaculture, Enabling Innovation",
    backToTop: "Back to top",

    pageComingSoon: "Content for this section will be added soon.",

    aboutEyebrow: "About Us",
    aboutTitle: "About Shrimp.News",
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
    contactBody:
      "General Enquiries:\n\nEditorial: editor@shrimp.news\n\nBusiness: sales@shrimp.news\n\nWe welcome editorial ideas, partnerships, advertising inquiries, and story submissions connected to the global shrimp industry.",

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
    privacyBody:
      "Shrimp.News respects your privacy and is committed to protecting your personal information.\n\nInformation collected through our website, including contact forms, newsletter subscriptions, cookies, and user interactions, is used solely to improve our services, communicate with our audience, and enhance user experience.\n\nWe do not sell, rent, or share personal information with third parties except where required by law or necessary to operate our services.\n\nBy accessing and using Shrimp.News, you consent to the collection and use of information in accordance with this Privacy Policy.\n\nThis Privacy Policy may be updated periodically without prior notice.",

    termsEyebrow: "Terms & Conditions",
    termsTitle: "Terms & Conditions",
    termsDescription:
      "The rules that apply when you access and use Shrimp.News.",
    termsBody:
      "By accessing and using Shrimp.News, you agree to comply with these Terms and Conditions.\n\nAll content published on Shrimp.News, including articles, images, graphics, videos, reports, and other materials, is protected by applicable intellectual property laws.\n\nContent may be shared for personal and non-commercial purposes with appropriate attribution. Reproduction, modification, or commercial use without prior written permission is prohibited.\n\nThe information published on Shrimp.News is intended for educational, informational, and industry awareness purposes.\n\nShrimp.News reserves the right to modify website content, services, and these Terms & Conditions at any time without prior notice.\n\nContinued use of the website constitutes acceptance of the latest version of these Terms.",

    disclaimerEyebrow: "Disclaimer",
    disclaimerTitle: "Disclaimer",
    disclaimerDescription:
      "Important limitations about the information published on Shrimp.News.",
    disclaimerBody:
      "The information available on Shrimp.News is provided for educational, informational, and industry awareness purposes only.\n\nWhile every effort is made to ensure the accuracy and reliability of published content, Shrimp.News does not guarantee that all information is complete, current, or free from errors.\n\nArticles covering shrimp farming, disease management, water quality, nutrition, markets, pricing, technology, exports, and policy should not be considered professional veterinary, financial, legal, investment, or regulatory advice.\n\nReaders are encouraged to consult qualified professionals before making farming, business, financial, or management decisions.\n\nShrimp.News, its publishers, editors, and contributors shall not be held responsible for any direct or indirect loss arising from the use of information published on this website.",

    askPranaHelpTitle: "How can Ask Prana help?",
    askPranaHelpDescription:
      "Ask about farming, pond health, feed, water quality, disease or shrimp markets.",

    language: "Language",
    english: "English",
    telugu: "Telugu",
    hindi: "Hindi",
  },

  te: {
    home: "హోమ్",
    news: "వార్తలు",
    topics: "అంశాలు",
    about: "గురించి",
    national: "భారతదేశం",
    international: "గ్లోబల్",
    india: "భారతదేశం",
    global: "గ్లోబల్",
    articles: "వ్యాసాలు",
    shrimpFarming: "రొయ్యల సాగు",
    shrimpPrices: "రొయ్యల ధరలు",
    shrimpHealth: "రొయ్యల ఆరోగ్యం",
    technologyEquipment: "సాంకేతికత & పరికరాలు",
    researchInnovations: "పరిశోధన & ఆవిష్కరణలు",
    domesticConsumption: "దేశీయ వినియోగం",
    marketsIndustry: "మార్కెట్లు & పరిశ్రమ",
    aboutUs: "మా గురించి",
    foundersMessage: "వ్యవస్థాపకుల సందేశం",
    contactUs: "సంప్రదించండి",
    askPrana: "రొయ్యల సాగు గురించి Ask Pranaని అడగండి",
    askPranaShort: "Ask Pranaని అడగండి...",
    askPranaButton: "Ask Prana",
    ask: "అడగండి",
    toggleNavigation: "నావిగేషన్ టోగుల్",
    noArticlesFound: "ఈ అంశానికి ఇంకా వ్యాసాలు లేవు.",
    relatedArticles: "సంబంధిత వ్యాసాలు",

    heroEyebrow: "భారతదేశానికి ప్రాధాన్యం · ప్రపంచ అవగాహన",
    heroTitleStart: "ప్రపంచ రొయ్యల",
    heroTitleMiddle: "రంగపు",
    heroTitleHighlight: "స్పందన",
    heroDescription:
      "రొయ్యల పెంపకం, వాణిజ్యం మరియు వినియోగంతో సంబంధం ఉన్న వారికి వార్తలు, ధరలు, మార్కెట్ సమాచారం, సాగు సూచనలు మరియు ఉపయోగకరమైన జ్ఞానం.",
    readLatest: "తాజా వార్తలు చదవండి",
    exploreArticles: "వ్యాసాలను చూడండి",

    latestArticles: "తాజా వ్యాసాలు",
    latestTitle: "రొయ్యల సరఫరా శృంఖలంలోని ప్రతి దశకు సమాచారం.",
    latestDescription:
      "దేశీయ వినియోగం, ధరలు, ఆరోగ్యం మరియు మార్కెట్ స్థిరత్వంపై తాజా వ్యాసాలు.",

    domesticTitle: "భారతదేశ రొయ్యల భవిష్యత్తు దేశీయ మార్కెట్ నుంచే ప్రారంభమవుతుంది.",
    domesticDescription:
      "దేశీయ డిమాండ్ Shrimp.News యొక్క ప్రధాన ప్రాధాన్యం. భారతదేశంలో రొయ్యల వినియోగం రైతులు, కుటుంబాలు మరియు బలమైన ఆహార ఆర్థిక వ్యవస్థకు ఎలా మద్దతు ఇస్తుందో తెలియజేస్తాము.",
    whyConsumptionLags: "వినియోగం ఎందుకు వెనుకబడింది",
    healthNutritionStories: "ఆరోగ్యం మరియు పోషక కథనాలు",

    marketsLabel: "రొయ్యల మార్కెట్లు & ధరలు",
    marketsTitle: "పరిశ్రమ నాయకుల కోసం రూపొందించిన మార్కెట్ సమాచారం.",
    marketsDescription:
      "రైతు స్థాయి లాభదాయకత మరియు రొయ్యల సరఫరా శృంఖలలో దీర్ఘకాలిక నమ్మకానికి ధరలు, ఎగుమతి డిమాండ్ మరియు మార్కెట్ సమతుల్యత కీలకం.",
    farmgatePriceDrivers: "ఫారమ్‌గేట్ ధరల కారకాలు",
    exportVsDomestic: "ఎగుమతి vs దేశీయ స్థిరత్వం",

    farmingHealthLabel: "రొయ్యల సాగు & ఆరోగ్యం",
    farmingTitle: "ఫారాలు, మేత మరియు బయోసెక్యూరిటీ కోసం ఉపయోగకరమైన సమాచారం.",
    farmingDescription:
      "పోషణ, వ్యాధి నివారణ, ఉత్తమ సాగు పద్ధతులు మరియు ఆరోగ్యకరమైన రొయ్యల ఉత్పత్తికి సంబంధించిన శాస్త్రీయ సమాచారం.",

    liveMarketIntel: "లైవ్ మార్కెట్ సమాచారం",
    marketsAtGlance: "రొయ్యల మార్కెట్లు ఒక చూపులో",
    liveDashboard: "లైవ్ డ్యాష్‌బోర్డ్",
    live: "లైవ్",
    thisWeek: "/కిలో · ఈ వారం",
    indiaExportsYtd: "భారత ఎగుమతులు YTD",
    indiaExportsDesc: "2025 అదే కాలంతో పోల్చితే",
    globalVannamei: "గ్లోబల్ వన్నామీ ఇండెక్స్",
    globalVannameiDesc: "US$/కిలో · 12 వారాల గరిష్టం",
    ecuadorBenchmark: "ఈక్వెడార్ బెంచ్‌మార్క్",
    ecuadorBenchmarkDesc: "ప్రపంచ కనిష్ట ధరను నిర్ణయిస్తుంది",
    feedCost: "మేత ఖర్చు",
    feedCostDesc: "వరుసగా 3వ వారం తగ్గుతోంది",
    newsExport: "సుంక భయాలు తగ్గడంతో అమెరికా షిప్‌మెంట్లు 12% పెరిగాయి",
    newsDisease: "ముఖ్య తీర ప్రాంతాల్లో ఫారమ్ అలర్టులు స్థిరంగా ఉన్నాయి",
    newsFeed: "వరుసగా మూడవ వారం మేత ధరలు తగ్గాయి",

    readFeaturedStory: "ప్రధాన కథనం చదవండి",
    readArticle: "వ్యాసం చదవండి →",
    imagePlaceholder: "చిత్రం స్థానం",

    aquaGptEyebrow: "Ask Prana",
    aquaGptTitle: "ఆక్వాకల్చర్-మాత్రమే AI సహాయకుడు",
    aquaGptDescription:
      "రొయ్యల సాగు, నీటి నాణ్యత, ధరలు, మార్కెట్లు, ఆరోగ్యం మరియు సాంకేతికత గురించి అడగండి. ఈ మాక్ సహాయకుడు ఆక్వాకల్చర్ పరిధిలో నమ్మకమైన అంతర్దృష్టులను అందిస్తుంది.",
    aquaGptOnline: "ఆన్‌లైన్",
    aquaGptPlaceholder: "ఉదా. భారత్‌లో రొయ్యల ధరలను ఏమి నిర్ణయిస్తుంది?",
    aquaGptEmpty: "ప్రారంభించడానికి రొయ్యలకు సంబంధించిన ప్రశ్నను నమోదు చేయండి.",
    aquaGptMockPrefix:
      "Ask Prana సంబంధిత వ్యాసాలు చదవమని మరియు పరిశ్రమ ఉత్తమ పద్ధతులను చూడమని సూచిస్తుంది. ఇది మాక్ ప్రతిస్పందన:",
    aquaPrompt1: "రొయ్యల ఫారమ్‌గేట్ ధరలను ఏమి ప్రభావితం చేస్తుంది?",
    aquaPrompt2: "చెరువుల్లో రొయ్యల వ్యాధిని ఎలా నివారించాలి?",
    aquaPrompt3: "భారత్‌కు ఉత్తమ రొయ్యల మేత పద్ధతులు",

    newsletterEyebrow: "Shrimp News Brief",
    newsletterTitle: "ది ష్రింప్ బ్రీఫ్",
    newsletterDescription:
      "ధరలు, వ్యాధి హెచ్చరికలు, విధాన అప్‌డేట్లు మరియు మార్కెట్ సమాచారం — ప్రతి సోమవారం. ఎప్పటికీ ఉచితం.",
    newsletterMondayNote:
      "You'll receive the Shrimp Brief every Monday — free forever.",
    newsletterEmailLabel: "ఇమెయిల్ చిరునామా",
    newsletterSubscribe: "ఉచితంగా సబ్‌స్క్రైబ్ చేయండి",
    newsletterEmptyError: "దయచేసి మీ ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
    newsletterInvalidError: "దయచేసి సరైన ఇమెయిల్ చిరునామాను నమోదు చేయండి.",
    newsletterSuccessPrefix: "Thank you for subscribing to the Shrimp Brief.",
    newsletterSuccessSuffix: "",

    footerTagline:
      "Shrimp News ప్రపంచ రొయ్యల పరిశ్రమకు మార్కెట్ ధరలు, సాగు సమాచారం, వ్యాధి నవీకరణలు, సాంకేతిక అంతర్దృష్టులు మరియు పరిశ్రమ వార్తలను అందిస్తుంది.",
    footerSubTagline: "భారత్ ఫారమ్‌ల నుంచి ప్రపంచ మార్కెట్ల వరకు.",
    categories: "వర్గాలు",
    latestNews: "తాజా వార్తలు",
    aquaticHealth: "జల ఆరోగ్యం",
    researchInnovation: "పరిశోధన & ఆవిష్కరణ",
    prices: "ధరలు",
    followShrimpNews: "Shrimp Newsను అనుసరించండి",
    allRightsReserved: "© 2026 Shrimp News. అన్ని హక్కులు రక్షించబడ్డాయి.",
    privacyPolicy: "గోప్యతా విధానం",
    terms: "నిబంధనలు",
    disclaimer: "డిస్‌క్లైమర్",
    contact: "సంప్రదించండి",
    ventureLine: "A Fishery News venture · Aquacultureను కలుపుతూ, ఆవిష్కరణను సాధ్యం చేస్తూ",
    backToTop: "పైకి వెళ్లండి",

    pageComingSoon: "ఈ విభాగం కంటెంట్ త్వరలో జోడించబడుతుంది.",

    aboutEyebrow: "మా గురించి",
    aboutTitle: "Shrimp.News గురించి",
    aboutDescription: "ప్రపంచ రొయ్యల పరిశ్రమ కోసం ప్రత్యేకంగా నిర్మించిన భారత్ యొక్క మొదటి అంకిత డిజిటల్ మీడియా వేదిక.",
    aboutBody: "Shrimp.News ప్రపంచ రొయ్యల పరిశ్రమ కోసం ప్రత్యేకంగా నిర్మించిన భారత్ యొక్క మొదటి అంకిత డిజిటల్ మీడియా వేదిక.\n\nమా లక్ష్యం—ప్రతి వాటాదారుకు నమ్మదగిన సమాచారం, ఆచరణాత్మక జ్ఞానం, మార్కెట్ ఇంటెలిజెన్స్ ఒకే వేదికపై అందించడం.\n\nభారత్‌లో దేశీయ రొయ్యల వినియోగాన్ని పెంచడం మా ముఖ్య ప్రాధాన్యం.",

    pricesEyebrow: "రొయ్యల ధరలు",
    pricesTitle: "నిర్ణయం తీసుకునే ముందు ధరను తెలుసుకోండి",
    pricesDescription: "ఫారమ్‌గేట్ ధరలు, కౌంట్ ఆధారిత అప్‌డేట్లు, వారపు ట్రెండ్లు మరియు మార్కెట్ అంతర్దృష్టి.",
    pricesBody: "రొయ్యల ధరలు స్టాకింగ్ నుంచి కోత, కొనుగోలు, వ్యాపారం వరకు ప్రతి నిర్ణయాన్ని ప్రభావితం చేస్తాయి.\n\nమీకు దొరికేది\nఫారమ్‌గేట్ ధరలు\nకౌంట్/సైజు వారీ అప్‌డేట్లు\nవారపు ట్రెండ్లు మరియు విశ్లేషణ\nకాలానుగుణ ధర మార్పులు",

    farmingEyebrow: "రొయ్యల సాగు",
    farmingPageTitle: "రొయ్యల ఉత్పత్తిదారుల కోసం ఆచరణాత్మక మార్గదర్శకం",
    farmingPageDescription:
      "చెరువు సిద్ధం, మేత, నీటి నాణ్యత మరియు ఫారమ్ నిర్వహణ వనరుల కోసం ఈ విభాగం రూపొందించబడింది.",
    farmingBody: "విజయవంతమైన రొయ్యల సాగు చెరువు నిర్వహణ, ఆరోగ్యకర సీడ్, స్థిర మేత, బయోసెక్యూరిటీ, సకాల కోతపై ఆధారపడుతుంది. క్రింది సాగు కథనాలు ఆచరణాత్మక మార్గదర్శం ఇస్తాయి.",

    domesticEyebrow: "దేశీయ వినియోగం",
    domesticPageTitle: "భారత రొయ్యలకు బలమైన మార్కెట్ నిర్మాణం",
    domesticPageDescription: "భారత్ అగ్ర రొయ్యల ఉత్పత్తిదారు అయినా దేశీయ వినియోగం ఇంకా తక్కువగానే ఉంది.",
    domesticBody: "Shrimp.News దృష్టిలో దేశీయ రొయ్యల వినియోగం పెంచడం భారత రొయ్యల పరిశ్రమ భవిష్యత్తుకు అతిపెద్ద అవకాశం.\n\nబలమైన దేశీయ మార్కెట్ రైతులు, ప్రాసెసర్లు, రిటైలర్లు, వినియోగదారులకు విలువ సృష్టించి ఎగుమతి ఆధారపడటాన్ని తగ్గిస్తుంది.",

    marketsEyebrow: "మార్కెట్లు మరియు పరిశ్రమ",
    marketsPageTitle: "రొయ్యల పరిశ్రమను రూపొందించే ట్రెండ్లు",
    marketsPageDescription: "మార్కెట్ పరిస్థితులు, వాణిజ్యం, విధానం, పెట్టుబడులు మరియు పరిశ్రమ అభివృద్ధులు.",
    marketsBody: "Shrimp.News సమయానుకూల మార్కెట్ ఇంటెలిజెన్స్ మరియు పరిశ్రమ అంతర్దృష్టులు అందిస్తుంది.\n\nమీకు దొరికేది\nపరిశ్రమ వార్తలు\nఎగుమతి మరియు వాణిజ్య అభివృద్ధులు\nప్రభుత్వ విధానాలు\nప్రాసెసింగ్ మరియు విలువ జోడింపు అప్‌డేట్లు",

    healthEyebrow: "రొయ్యల ఆరోగ్యం",
    healthTitle: "ఆరోగ్యకర రొయ్యలు. ఆరోగ్యకర ఫారాలు. మెరుగైన లాభాలు.",
    healthDescription: "రొయ్యల ఆరోగ్యం, వ్యాధి నివారణ, బయోసెక్యూరిటీ, నీటి నాణ్యతపై ఆచరణాత్మక సమాచారం.",
    healthBody: "ఆరోగ్యకర రొయ్యలు విజయవంతమైన సాగుకు పునాది. వ్యాధి వ్యాప్తి ప్రాణాలు, ఉత్పత్తి, లాభాలపై తీవ్ర ప్రభావం చూపుతుంది.\n\nమీకు దొరికేది\nEHP, WSSV, AHPND/EMS, Vibrio\nబయోసెక్యూరిటీ\nనీటి నాణ్యత నిర్వహణ\nఆచరణాత్మక ఫారమ్ మార్గదర్శకాలు",

    techEyebrow: "సాంకేతికత",
    techTitle: "ఆవిష్కరణ మరియు ఆక్వాకల్చర్ సాంకేతికత",
    techDescription:
      "ఆధునిక సాధనాలు, మానిటరింగ్ వ్యవస్థలు మరియు ఉద్భవిస్తున్న ఫారమ్ సాంకేతికత అంతర్దృష్టులు ఇక్కడ ఫీచర్ చేయబడతాయి.",
    techBody: "సాంకేతికత రొయ్యల సాగును స్మార్ట్‌గా మారుస్తోంది. సెన్సార్లు, ఆటోమేషన్, AI సహాయ నిర్ణయాల వరకు—తదుపరి దశాబ్ద ఆక్వాకల్చర్‌ అంతర్దృష్టులను అన్వేషించండి.",

    articlesEyebrow: "వ్యాసాలు",
    articlesTitle: "మొదటి 20 లాంచ్ వ్యాసాలు",
    articlesDescription:
      "సైట్ అనుభవానికి సరిపోయేలా రూపొందించిన ఎడిటోరియల్ కథనాలు, మార్కెట్ అంతర్దృష్టి మరియు రొయ్యల సమాచారం యొక్క లాంచ్ ఆర్కైవ్.",
    newsIndiaTitle: "భారత రొయ్యల పరిశ్రమ అప్‌డేట్‌లతో ఉండండి",
    newsIndiaDescription:
      "Shrimp.News భారత రొయ్యల రంగం నుంచి తాజా వార్తలు, విధానాలు, సాగు అప్‌డేట్‌లు, వ్యాధి అలర్ట్‌లు, పరిశోధన, పెట్టుబడులు మరియు పరిశ్రమ కార్యక్రమాలను అందిస్తుంది. భారత రొయ్యల సాగు మరియు ఆక్వాకల్చర్‌ను రూపొందిస్తున్న కథనాలపై మిమ్మల్ని అప్‌డేట్‌గా ఉంచుతుంది.",
    newsGlobalTitle: "ముఖ్యమైన గ్లోబల్ పరిణామాలు",
    newsGlobalDescription:
      "ప్రపంచ రొయ్యల పరిశ్రమ నిరంతరం మారుతోంది. Shrimp.News మార్కెట్ ట్రెండ్‌లు, వాణిజ్యం, సాంకేతికత, పరిశోధన, సస్టైనబిలిటీ మరియు ప్రధాన ఉత్పత్తి/వినియోగ దేశాల విధాన అప్‌డేట్‌లతో మిమ్మల్ని గ్లోబల్ రొయ్యల పర్యావరణ వ్యవస్థకు అనుసంధానం చేస్తుంది.",
    articleDetailEyebrow: "వ్యాసం",
    articleDetailTitle: "డైనమిక్ వ్యాస వివరాలు",
    articleDetailDescription:
      "భవిష్యత్ ఎడిటోరియల్ కంటెంట్ మరియు SEO మెటాడేటా కోసం వ్యాస వివర రూట్‌లు సిద్ధం చేయబడ్డాయి.",
    articleDetailBody:
      "కంటెంట్ అందుబాటులోకి వచ్చిన తర్వాత ఈ రూట్ ఎంచుకున్న వ్యాసాన్ని చూపుతుంది.",

    founderEyebrow: "వ్యవస్థాపకుల సందేశం",
    founderTitle: "వ్యవస్థాపకుల నుంచి సందేశం",
    founderDescription:
      "ఈ పేజీ వ్యవస్థాపకుల దృక్పథం, దృష్టి మరియు ప్లాట్‌ఫామ్ దీర్ఘకాలిక లక్ష్యాలను హోస్ట్ చేస్తుంది.",
    founderBody: "భారత్ ప్రపంచంలోని అగ్ర రొయ్యల ఉత్పత్తిదారు దేశాలలో ఒకటిగా నిలిచింది.\n\nఅయితే ఒక ముఖ్యమైన ప్రశ్న Shrimp.News సృష్టికి ప్రేరణం ఇచ్చింది: రొయ్యల పర్యావరణ వ్యవస్థన్ని ఒకచోట కలిపే ప్రత్యేక ప్రపంచ వేదిక ఎందుకు లేదు?\n\nShrimp.News ఆ ప్రశ్నకు జవాబుడానికి సృష్టించబడింది.",

    contactEyebrow: "సంప్రదించండి",
    contactTitle: "మమ్మల్ని సంప్రదించండి",
    contactDescription:
      "ఎడిటోరియల్, వ్యాపారం మరియు భాగస్వామ్య విచారణల కోసం సంప్రదింపు అనుభవం ఇక్కడ నిర్మించబడుతుంది.",
    contactBody:
      "సాధారణ విచారణలు:\n\nEditorial: editor@shrimp.news\n\nBusiness: sales@shrimp.news\n\nఎడిటోరియల్ ఆలోచనలు, భాగస్వామ్యాలు, ప్రకటనలు, కథన సూచనలను స్వాగతిస్తాము.",

    askPageEyebrow: "Ask Pranaని అడగండి",
    askPageTitle: "రొయ్యల సమాచార సహాయకుడిని అడగండి",
    askPageDescription:
      "రొయ్యల సాగు, ధరలు, ఆరోగ్యం మరియు ఎడిటోరియల్ ప్రశ్నలకు మద్దతు ఇవ్వడానికి ఈ అనుభవం సిద్ధం చేయబడుతోంది.",
    askPageBody:
      "కంటెంట్ మరియు ఇంటరాక్షన్ మోడల్ ఖరారైన తర్వాత Ask Prana అనుభవం అమలు చేయబడుతుంది.",

    privacyEyebrow: "గోప్యతా విధానం",
    privacyTitle: "గోప్యతా విధానం",
    privacyDescription:
      "Shrimp.News మీ వ్యక్తిగత సమాచారాన్ని ఎలా సేకరిస్తుంది, ఉపయోగిస్తుంది మరియు రక్షిస్తుంది.",
    privacyBody:
      "Shrimp.News respects your privacy and is committed to protecting your personal information.\n\nInformation collected through our website, including contact forms, newsletter subscriptions, cookies, and user interactions, is used solely to improve our services, communicate with our audience, and enhance user experience.\n\nWe do not sell, rent, or share personal information with third parties except where required by law or necessary to operate our services.\n\nBy accessing and using Shrimp.News, you consent to the collection and use of information in accordance with this Privacy Policy.\n\nThis Privacy Policy may be updated periodically without prior notice.",

    termsEyebrow: "నిబంధనలు మరియు షరతులు",
    termsTitle: "నిబంధనలు మరియు షరతులు",
    termsDescription:
      "Shrimp.Newsను ఉపయోగించేటప్పుడు వర్తించే నియమాలు.",
    termsBody:
      "By accessing and using Shrimp.News, you agree to comply with these Terms and Conditions.\n\nAll content published on Shrimp.News, including articles, images, graphics, videos, reports, and other materials, is protected by applicable intellectual property laws.\n\nContent may be shared for personal and non-commercial purposes with appropriate attribution. Reproduction, modification, or commercial use without prior written permission is prohibited.\n\nThe information published on Shrimp.News is intended for educational, informational, and industry awareness purposes.\n\nShrimp.News reserves the right to modify website content, services, and these Terms & Conditions at any time without prior notice.\n\nContinued use of the website constitutes acceptance of the latest version of these Terms.",

    disclaimerEyebrow: "డిస్‌క్లైమర్",
    disclaimerTitle: "డిస్‌క్లైమర్",
    disclaimerDescription:
      "Shrimp.Newsలో ప్రచురించిన సమాచారం గురించి ముఖ్యమైన పరిమితులు.",
    disclaimerBody:
      "The information available on Shrimp.News is provided for educational, informational, and industry awareness purposes only.\n\nWhile every effort is made to ensure the accuracy and reliability of published content, Shrimp.News does not guarantee that all information is complete, current, or free from errors.\n\nArticles covering shrimp farming, disease management, water quality, nutrition, markets, pricing, technology, exports, and policy should not be considered professional veterinary, financial, legal, investment, or regulatory advice.\n\nReaders are encouraged to consult qualified professionals before making farming, business, financial, or management decisions.\n\nShrimp.News, its publishers, editors, and contributors shall not be held responsible for any direct or indirect loss arising from the use of information published on this website.",

    askPranaHelpTitle: "Ask Prana ఎలా సహాయం చేయగలదు?",
    askPranaHelpDescription:
      "సాగు, చెరువు ఆరోగ్యం, మేత, నీటి నాణ్యత, వ్యాధి లేదా రొయ్యల మార్కెట్ల గురించి అడగండి.",

    language: "భాష",
    english: "ఇంగ్లీష్",
    telugu: "తెలుగు",
    hindi: "హిందీ",
  },

  hi: {
    home: "होम",
    news: "समाचार",
    topics: "विषय",
    about: "परिचय",
    national: "भारत",
    international: "वैश्विक",
    india: "भारत",
    global: "वैश्विक",
    articles: "लेख",
    shrimpFarming: "झींगा पालन",
    shrimpPrices: "झींगा कीमतें",
    shrimpHealth: "झींगा स्वास्थ्य",
    technologyEquipment: "तकनीक और उपकरण",
    researchInnovations: "शोध और नवाचार",
    domesticConsumption: "घरेलू खपत",
    marketsIndustry: "बाज़ार और उद्योग",
    aboutUs: "हमारे बारे में",
    foundersMessage: "संस्थापक का संदेश",
    contactUs: "संपर्क करें",
    askPrana: "झींगा पालन के बारे में Ask Prana से पूछें",
    askPranaShort: "Ask Prana से पूछें...",
    askPranaButton: "Ask Prana",
    ask: "पूछें",
    toggleNavigation: "नेविगेशन टॉगल करें",
    noArticlesFound: "इस विषय के लिए अभी कोई लेख नहीं मिला.",
    relatedArticles: "संबंधित लेख",

    heroEyebrow: "भारत प्रथम · वैश्विक दृष्टिकोण",
    heroTitleStart: "वैश्विक झींगा बाज़ार की",
    heroTitleMiddle: "",
    heroTitleHighlight: "धड़कन",
    heroDescription:
      "झींगा उत्पादकों, व्यापारियों और उपभोक्ताओं के लिए समाचार, झींगा कीमतें, बाज़ार जानकारी, पालन संबंधी सुझाव और उपयोगी ज्ञान.",
    readLatest: "नवीनतम पढ़ें",
    exploreArticles: "लेख देखें",

    latestArticles: "नवीनतम लेख",
    latestTitle: "झींगा आपूर्ति श्रृंखला के हर हिस्से के लिए जानकारी.",
    latestDescription:
      "घरेलू खपत, कीमतों, स्वास्थ्य और बाज़ार स्थिरता पर नवीनतम लेख.",

    domesticTitle: "भारत में झींगा का भविष्य घरेलू बाज़ार से शुरू होता है.",
    domesticDescription:
      "घरेलू मांग Shrimp.News की प्रमुख प्राथमिकता है. हम बताते हैं कि भारत में झींगा का सेवन किसानों, परिवारों और मजबूत खाद्य अर्थव्यवस्था को कैसे समर्थन देता है.",
    whyConsumptionLags: "खपत क्यों पीछे है",
    healthNutritionStories: "स्वास्थ्य और पोषण की कहानियाँ",

    marketsLabel: "झींगा बाज़ार और कीमतें",
    marketsTitle: "उद्योग के नेताओं के लिए तैयार की गई बाज़ार जानकारी.",
    marketsDescription:
      "फार्म स्तर की लाभप्रदता और झींगा आपूर्ति श्रृंखला में दीर्घकालिक विश्वास के लिए कीमतें, निर्यात मांग और बाज़ार संतुलन महत्वपूर्ण हैं.",
    farmgatePriceDrivers: "फार्मगेट कीमत के कारक",
    exportVsDomestic: "निर्यात बनाम घरेलू स्थिरता",

    farmingHealthLabel: "झींगा पालन और स्वास्थ्य",
    farmingTitle: "फार्म, फ़ीड और जैव सुरक्षा के लिए व्यावहारिक जानकारी.",
    farmingDescription:
      "पोषण, रोग रोकथाम, सर्वोत्तम पालन पद्धतियों और स्वस्थ झींगा उत्पादन के विज्ञान से संबंधित लेख.",

    liveMarketIntel: "लाइव बाज़ार जानकारी",
    marketsAtGlance: "झींगा बाज़ार एक नज़र में",
    liveDashboard: "लाइव डैशबोर्ड",
    live: "लाइव",
    thisWeek: "/किग्रा · इस सप्ताह",
    indiaExportsYtd: "भारत निर्यात YTD",
    indiaExportsDesc: "2025 की समान अवधि की तुलना में",
    globalVannamei: "ग्लोबल वन्नामी इंडेक्स",
    globalVannameiDesc: "US$/किग्रा · 12-सप्ताह उच्च",
    ecuadorBenchmark: "इक्वाडोर बेंचमार्क",
    ecuadorBenchmarkDesc: "वैश्विक न्यूनतम निर्धारित करता है",
    feedCost: "फ़ीड लागत",
    feedCostDesc: "लगातार तीसरे सप्ताह में राहत",
    newsExport: "टैरिफ चिंता कम होने से अमेरिकी शिपमेंट में 12% वृद्धि",
    newsDisease: "मुख्य तटीय क्षेत्रों में फार्म अलर्ट स्थिर हैं",
    newsFeed: "लगातार तीसरे सप्ताह फ़ीड कीमतें घटीं",

    readFeaturedStory: "विशेष कहानी पढ़ें",
    readArticle: "लेख पढ़ें →",
    imagePlaceholder: "छवि प्लेसहोल्डर",

    aquaGptEyebrow: "Ask Prana",
    aquaGptTitle: "केवल एक्वाकल्चर AI सहायक",
    aquaGptDescription:
      "झींगा पालन, जल गुणवत्ता, कीमतों, बाज़ार, स्वास्थ्य और तकनीक के बारे में पूछें. यह मॉक सहायक एक्वाकल्चर तक सीमित विश्वसनीय जानकारी खोजने में मदद करता है.",
    aquaGptOnline: "ऑनलाइन",
    aquaGptPlaceholder: "उदा. भारत में झींगा कीमतें क्या तय करती हैं?",
    aquaGptEmpty: "शुरू करने के लिए झींगा से संबंधित प्रश्न दर्ज करें.",
    aquaGptMockPrefix:
      "Ask Prana संबंधित लेख पढ़ने और उद्योग की सर्वोत्तम प्रथाएँ देखने का सुझाव देता है. यह एक मॉक प्रतिक्रिया है:",
    aquaPrompt1: "झींगा फार्मगेट कीमतों को क्या प्रभावित करता है?",
    aquaPrompt2: "तालाबों में झींगा रोग कैसे रोकें?",
    aquaPrompt3: "भारत के लिए सर्वश्रेष्ठ झींगा फ़ीड पद्धतियाँ",

    newsletterEyebrow: "Shrimp News Brief",
    newsletterTitle: "द श्रिंप ब्रीफ़",
    newsletterDescription:
      "कीमतें, रोग अलर्ट, नीति अपडेट और बाज़ार जानकारी — हर सोमवार. हमेशा मुफ़्त.",
    newsletterMondayNote:
      "You'll receive the Shrimp Brief every Monday — free forever.",
    newsletterEmailLabel: "ईमेल पता",
    newsletterSubscribe: "मुफ़्त सदस्यता लें",
    newsletterEmptyError: "कृपया अपना ईमेल पता दर्ज करें.",
    newsletterInvalidError: "कृपया एक मान्य ईमेल पता दर्ज करें.",
    newsletterSuccessPrefix: "Thank you for subscribing to the Shrimp Brief.",
    newsletterSuccessSuffix: "",

    footerTagline:
      "Shrimp News वैश्विक झींगा पारिस्थितिकी तंत्र के लिए बाज़ार कीमतें, पालन जानकारी, रोग अपडेट, तकनीक अंतर्दृष्टि और उद्योग समाचार प्रदान करता है.",
    footerSubTagline: "भारत के फार्म से वैश्विक बाज़ार तक.",
    categories: "श्रेणियाँ",
    latestNews: "नवीनतम समाचार",
    aquaticHealth: "जलीय स्वास्थ्य",
    researchInnovation: "शोध और नवाचार",
    prices: "कीमतें",
    followShrimpNews: "Shrimp News को फ़ॉलो करें",
    allRightsReserved: "© 2026 Shrimp News. सर्वाधिकार सुरक्षित.",
    privacyPolicy: "गोपनीयता नीति",
    terms: "नियम",
    disclaimer: "अस्वीकरण",
    contact: "संपर्क",
    ventureLine: "A Fishery News venture · एक्वाकल्चर जोड़ना, नवाचार सक्षम करना",
    backToTop: "ऊपर जाएँ",

    pageComingSoon: "इस अनुभाग की सामग्री जल्द जोड़ी जाएगी.",

    aboutEyebrow: "हमारे बारे में",
    aboutTitle: "Shrimp.News के बारे में",
    aboutDescription: "वैश्विक झींगा उद्योग के लिए बनाया गया भारत का पहला समर्पित डिजिटल मीडिया प्लेटफ़ॉर्म.",
    aboutBody: "Shrimp.News वैश्विक झींगा उद्योग के लिए बनाया गया भारत का पहला समर्पित डिजिटल मीडिया प्लेटफ़ॉर्म है.\n\nहमारा उद्देश्य: हर हिस्सेदार को विश्वसनीय जानकारी, व्यावहारिक ज्ञान और बाजार इंटेलिजेंस एक ही स्थान पर मिलें.\n\nभारत में घरेलू झींगा खपत बढाना हमारी मुख्य प्राथमिकता है.",

    pricesEyebrow: "झींगा कीमतें",
    pricesTitle: "निर्णय से पहले कीमत जानें",
    pricesDescription: "फार्मगेट कीमतें, काउंट-आधारित अपडेट, साप्ताहिक रुझान और बाजार अंतर्दृष्टि.",
    pricesBody: "झींगा कीमतें स्टॉकिंग से कटाई, खरीद और व्यापार तक हर निर्णय को प्रभावित करती हैं.\n\nआपको यहाँ मिलेगा\nफार्मगेट कीमतें\nकाउंट/साइज अपडेट\nसाप्ताहिक रुझान और विश्लेषण\nमौसमी मूल्य बदलाव",

    farmingEyebrow: "झींगा पालन",
    farmingPageTitle: "झींगा उत्पादकों के लिए व्यावहारिक मार्गदर्शन",
    farmingPageDescription:
      "तालाब तैयारी, फ़ीड, जल गुणवत्ता और फार्म प्रबंधन संसाधनों के लिए यह अनुभाग संरचित है.",
    farmingBody: "सफल झींगा पालन तालाब प्रबंधन, स्वस्थ बीज, स्थिर फ़ीड, जैव सुरक्षा और समय पर कटाई पर निर्भर करता है. नीचे पालन लेख व्यावहारिक मार्गदर्शन देते हैं.",

    domesticEyebrow: "घरेलू खपत",
    domesticPageTitle: "भारतीय झींगे के लिए मजबूत बाजार",
    domesticPageDescription: "भारत अग्रणी झींगा उत्पादक है, फिर भी घरेलू खपत अपेक्षाकृत कम है.",
    domesticBody: "Shrimp.News का मानना है कि घरेलू झींगा खपत बढाना भारत के झींगा उद्योग का बड़ा अवसर है.\n\nमजबूत घरेलू बाजार किसानों, प्रोसेसरों, रिटेलरों और उपभोक्ताओं के लिए मूल्य बनाता है और निर्यात पर निर्भरता घटाता है.",

    marketsEyebrow: "बाज़ार और उद्योग",
    marketsPageTitle: "झींगा उद्योग को आकार देने वाले रुझान",
    marketsPageDescription: "बाजार स्थितियाँ, व्यापार, नीति, निवेश और उद्योग विकास.",
    marketsBody: "Shrimp.News समयानुकूल बाजार इंटेलिजेंस और उद्योग अंतर्दृष्टि देता है.\n\nआपको यहाँ मिलेगा\nउद्योग समाचार\nनिर्यात और व्यापार विकास\nसरकारी नीति\nप्रोसेसिंग और वैल्यू-एडेड अपडेट",

    healthEyebrow: "झींगा स्वास्थ्य",
    healthTitle: "स्वस्थ झींगा. स्वस्थ फार्म. बेहतर लाभ.",
    healthDescription: "झींगा स्वास्थ्य, रोग रोकथाम, जैव सुरक्षा और जल गुणवत्ता पर व्यावहारिक जानकारी.",
    healthBody: "स्वस्थ झींगा सफल पालन की नींव है. रोग प्रकोप सर्वाइवल, उत्पादन और लाभ पर गंभीर प्रभाव डाल सकते हैं.\n\nआपको यहाँ मिलेगा\nEHP, WSSV, AHPND/EMS, Vibrio\nजैव सुरक्षा\nजल गुणवत्ता प्रबंधन\nव्यावहारिक फार्म मार्गदर्शिकाएँ",

    techEyebrow: "तकनीक",
    techTitle: "नवाचार और एक्वाकल्चर तकनीक",
    techDescription:
      "आधुनिक उपकरण, निगरानी प्रणालियाँ और उभरती फार्म तकनीक अंतर्दृष्टि यहाँ दिखाई जाएँगी.",
    techBody: "तकनीक झींगा पालन को स्मार्ट बना रही है. सेंसर, ऑटोमेशन और AI-सहायित निर्णयों तक—अगले दशक की एक्वाकल्चर अंतर्दृष्टि देखें.",

    articlesEyebrow: "लेख",
    articlesTitle: "पहले 20 लॉन्च लेख",
    articlesDescription:
      "साइट अनुभव से मेल खाते संपादकीय कहानियों, बाज़ार अंतर्दृष्टि और झींगा जानकारी का पॉलिश्ड लॉन्च आर्काइव.",
    newsIndiaTitle: "भारत के झींगा उद्योग से जुड़े रहें",
    newsIndiaDescription:
      "Shrimp.News भारत के झींगा क्षेत्र की ताज़ा खबरें और विकास लाता है—सरकारी नीतियाँ, फार्मिंग अपडेट, रोग अलर्ट, शोध, निवेश और उद्योग पहलों तक। हमारी राष्ट्रीय कवरेज आपको भारतीय झींगा पालन और एक्वाकल्चर को आकार देने वाली कहानियों से अवगत रखती है।",
    newsGlobalTitle: "महत्वपूर्ण वैश्विक विकास",
    newsGlobalDescription:
      "वैश्विक झींगा उद्योग लगातार बदल रहा है। Shrimp.News बाज़ार रुझान, व्यापार, तकनीक, शोध, स्थिरता और प्रमुख उत्पादक/उपभोक्ता देशों की नीति अपडेट सहित अंतरराष्ट्रीय विकास कवर करता है, ताकि आप वैश्विक झींगा पारिस्थितिकी तंत्र से जुड़े रहें।",
    articleDetailEyebrow: "लेख",
    articleDetailTitle: "डायनामिक लेख विवरण",
    articleDetailDescription:
      "भविष्य की संपादकीय सामग्री और SEO मेटाडेटा के लिए लेख विवरण रूट तैयार किए गए हैं.",
    articleDetailBody:
      "सामग्री उपलब्ध होने पर यह रूट चुने गए लेख को दिखाएगा.",

    founderEyebrow: "संस्थापक का संदेश",
    founderTitle: "संस्थापक का संदेश",
    founderDescription:
      "यह पेज संस्थापक के दृष्टिकोण, दृष्टि और प्लेटफ़ॉर्म के दीर्घकालिक लक्ष्यों को होस्ट करेगा.",
    founderBody: "भारत विश्व के प्रमुख झींगा उत्पादक देशों में से एक बन चुका है.\n\nफिर भी एक महत्वपूर्ण प्रश्न ने Shrimp.News की रचना की: पूरे झींगा पारिस्थितिकी तंत्र को जोडने वाला कोई समर्पित वैश्विक प्लेटफ़ॉर्म क्यों नहीं?\n\nShrimp.News उसी प्रश्न का उत्तर देने के लिए बनाया गया.",

    contactEyebrow: "संपर्क करें",
    contactTitle: "हमसे संपर्क करें",
    contactDescription:
      "संपादकीय, व्यवसाय और साझेदारी पूछताछ के लिए संपर्क अनुभव यहाँ बनाया जाएगा.",
    contactBody:
      "सामान्य पूछताछ:\n\nEditorial: editor@shrimp.news\n\nBusiness: sales@shrimp.news\n\nहम संपादकीय विचार, साझेदारी, विज्ञापन और कहानी सुझावों का स्वागत करते हैं.",

    askPageEyebrow: "Ask Prana से पूछें",
    askPageTitle: "झींगा जानकारी सहायक से पूछें",
    askPageDescription:
      "झींगा पालन, कीमतों, स्वास्थ्य और संपादकीय प्रश्नों का समर्थन करने के लिए यह अनुभव तैयार किया जा रहा है.",
    askPageBody:
      "सामग्री और इंटरैक्शन मॉडल तय होने के बाद Ask Prana अनुभव लागू किया जाएगा.",

    privacyEyebrow: "गोपनीयता नीति",
    privacyTitle: "गोपनीयता नीति",
    privacyDescription:
      "Shrimp.News आपकी व्यक्तिगत जानकारी कैसे एकत्र करता है, उपयोग करता है और सुरक्षित रखता है.",
    privacyBody:
      "Shrimp.News respects your privacy and is committed to protecting your personal information.\n\nInformation collected through our website, including contact forms, newsletter subscriptions, cookies, and user interactions, is used solely to improve our services, communicate with our audience, and enhance user experience.\n\nWe do not sell, rent, or share personal information with third parties except where required by law or necessary to operate our services.\n\nBy accessing and using Shrimp.News, you consent to the collection and use of information in accordance with this Privacy Policy.\n\nThis Privacy Policy may be updated periodically without prior notice.",

    termsEyebrow: "नियम और शर्तें",
    termsTitle: "नियम और शर्तें",
    termsDescription:
      "Shrimp.News का उपयोग करते समय लागू होने वाले नियम.",
    termsBody:
      "By accessing and using Shrimp.News, you agree to comply with these Terms and Conditions.\n\nAll content published on Shrimp.News, including articles, images, graphics, videos, reports, and other materials, is protected by applicable intellectual property laws.\n\nContent may be shared for personal and non-commercial purposes with appropriate attribution. Reproduction, modification, or commercial use without prior written permission is prohibited.\n\nThe information published on Shrimp.News is intended for educational, informational, and industry awareness purposes.\n\nShrimp.News reserves the right to modify website content, services, and these Terms & Conditions at any time without prior notice.\n\nContinued use of the website constitutes acceptance of the latest version of these Terms.",

    disclaimerEyebrow: "अस्वीकरण",
    disclaimerTitle: "अस्वीकरण",
    disclaimerDescription:
      "Shrimp.News पर प्रकाशित जानकारी से जुड़ी महत्वपूर्ण सीमाएँ.",
    disclaimerBody:
      "The information available on Shrimp.News is provided for educational, informational, and industry awareness purposes only.\n\nWhile every effort is made to ensure the accuracy and reliability of published content, Shrimp.News does not guarantee that all information is complete, current, or free from errors.\n\nArticles covering shrimp farming, disease management, water quality, nutrition, markets, pricing, technology, exports, and policy should not be considered professional veterinary, financial, legal, investment, or regulatory advice.\n\nReaders are encouraged to consult qualified professionals before making farming, business, financial, or management decisions.\n\nShrimp.News, its publishers, editors, and contributors shall not be held responsible for any direct or indirect loss arising from the use of information published on this website.",

    askPranaHelpTitle: "Ask Prana कैसे मदद कर सकता है?",
    askPranaHelpDescription:
      "पालन, तालाब स्वास्थ्य, फ़ीड, जल गुणवत्ता, रोग या झींगा बाज़ारों के बारे में पूछें.",

    language: "भाषा",
    english: "अंग्रेज़ी",
    telugu: "तेलुगु",
    hindi: "हिंदी",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const language = useSyncExternalStore<Language>(
    subscribeToLanguage,
    getStoredLanguage,
    () => "en" as Language,
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((newLanguage: Language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    document.documentElement.lang = newLanguage;
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }, []);

  const t = useCallback(
    (key: TranslationKey) =>
      translations[language][key] ?? translations.en[key] ?? String(key),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
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
