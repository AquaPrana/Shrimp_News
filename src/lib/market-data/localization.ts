import type { Language } from "@/context/language-context";

const marketLabels: Record<string, Record<Language, string>> = {
  VAN_C40: {
    en: "Vannamei C40",
    te: "వనామీ C40",
    hi: "वन्नामी C40",
  },
  VAN_C50: {
    en: "Vannamei C50",
    te: "వనామీ C50",
    hi: "वन्नामी C50",
  },
  VAN_C30: {
    en: "Vannamei C30",
    te: "వనామీ C30",
    hi: "वन्नामी C30",
  },
  BLACK_TIGER_C30: {
    en: "Black Tiger C30",
    te: "బ్లాక్ టైగర్ C30",
    hi: "ब्लैक टाइगर C30",
  },
  FEED_INR: {
    en: "Feed",
    te: "రొయ్యల మేత",
    hi: "झींगा फ़ीड",
  },
  USD_INR: {
    en: "USD/INR",
    te: "USD/INR",
    hi: "USD/INR",
  },
  EXPORTS_MT: {
    en: "India Exports",
    te: "భారత ఎగుమతులు",
    hi: "भारत निर्यात",
  },
  GLOBAL_VANNAMEI: {
    en: "Global Vannamei Index",
    te: "ప్రపంచ వనామీ సూచీ",
    hi: "वैश्विक वन्नामी सूचकांक",
  },
};

export const marketTickerCopy: Record<
  Language,
  {
    tickerLabel: string;
    updatesLabel: string;
    live: string;
    delayed: string;
    unavailable: string;
    retry: string;
    error: string;
    change: string;
    directions: Record<"up" | "down" | "neutral", string>;
  }
> = {
  en: {
    tickerLabel: "Shrimp market ticker",
    updatesLabel: "Market price updates",
    live: "Live",
    delayed: "Delayed",
    unavailable: "Market data temporarily unavailable",
    retry: "Retry",
    error: "Unable to refresh market data",
    change: "change",
    directions: { up: "up", down: "down", neutral: "neutral" },
  },
  te: {
    tickerLabel: "రొయ్యల మార్కెట్ టిక్కర్",
    updatesLabel: "మార్కెట్ ధరల తాజా సమాచారం",
    live: "ప్రత్యక్షం",
    delayed: "ఆలస్యం",
    unavailable: "మార్కెట్ సమాచారం తాత్కాలికంగా అందుబాటులో లేదు",
    retry: "మళ్లీ ప్రయత్నించండి",
    error: "మార్కెట్ సమాచారాన్ని నవీకరించలేకపోయాం",
    change: "మార్పు",
    directions: { up: "పెరుగుదల", down: "తగ్గుదల", neutral: "మార్పు లేదు" },
  },
  hi: {
    tickerLabel: "झींगा बाज़ार टिकर",
    updatesLabel: "बाज़ार मूल्य अपडेट",
    live: "लाइव",
    delayed: "विलंबित",
    unavailable: "बाज़ार डेटा अस्थायी रूप से उपलब्ध नहीं है",
    retry: "फिर प्रयास करें",
    error: "बाज़ार डेटा रीफ़्रेश नहीं हो सका",
    change: "बदलाव",
    directions: { up: "बढ़त", down: "गिरावट", neutral: "स्थिर" },
  },
};

const localizedUnits: Record<string, Record<Language, string>> = {
  kg: { en: "kg", te: "కిలో", hi: "किलो" },
  MT: { en: "MT", te: "మెట్రిక్ టన్నులు", hi: "मीट्रिक टन" },
  pair: { en: "pair", te: "జత", hi: "जोड़ी" },
};

export function getLocalizedMarketLabel(
  symbol: string,
  fallbackLabel: string,
  language: Language,
) {
  return marketLabels[symbol]?.[language] ?? fallbackLabel;
}

export function getLocalizedMarketUnit(unit: string, language: Language) {
  return localizedUnits[unit]?.[language] ?? unit;
}
