const siteData = {
  navigation: [
    { label: "Feed", href: "/pages/feed.html", active: true },
    { label: "Markets", href: "/pages/markets.html" },
    { label: "Tools", href: "/pages/tools.html" },
    { label: "Ask AquaGPT", href: "/pages/ask-aquaprana.html" },
    { label: "Learn", href: "/pages/learn.html" },
    { label: "Events", href: "/pages/events.html" },
    { label: "About", href: "/pages/about.html" }
  ],
  tickerItems: [
    { label: "VANNAMEI", value: "₹ 315/kg", change: "+2.4%", positive: true },
    { label: "L. VANNAMEI", value: "₹ 322/kg", change: "+1.1%", positive: true },
    { label: "EXPORT", value: "$ 5.4/kg", change: "-0.6%", positive: false },
    { label: "ANDHRA", value: "₹ 308/kg", change: "+3.2%", positive: true },
    { label: "ODISHA", value: "₹ 314/kg", change: "+0.9%", positive: true },
    { label: "GUJARAT", value: "₹ 311/kg", change: "-0.4%", positive: false }
  ],
  marketMetrics: [
    { title: "Farmgate index", value: "₹ 314/kg", change: "+2.1%", meta: "Week over week", positive: true },
    { title: "Export demand", value: "$ 5.4/kg", change: "-0.6%", meta: "Frozen segment", positive: false },
    { title: "Domestic growth", value: "+18%", change: "+4.6%", meta: "Consumer demand", positive: true },
    { title: "Disease pressure", value: "Low", change: "-1.2%", meta: "Biosecurity outlook", positive: true }
  ],
  signalAlerts: [
    { time: "09:10 IST", label: "Policy", title: "Domestic consumption push gains momentum in Andhra Pradesh", description: "Retail partners expand shrimp awareness campaigns and new culinary partnerships." },
    { time: "08:40 IST", label: "Disease", title: "Water quality remains the top risk in early season ponds", description: "Producers are prioritizing dissolved oxygen and salinity monitoring." },
    { time: "07:25 IST", label: "Trade", title: "Export demand steady as buyers digest price volatility", description: "Global demand is stable but the market remains selective." }
  ],
  stateMarkets: [
    { name: "Andhra Pradesh", price: "₹ 312/kg", change: "+3.2%", status: "Strong demand" },
    { name: "Odisha", price: "₹ 308/kg", change: "+1.8%", status: "Improved harvesting" },
    { name: "Tamil Nadu", price: "₹ 315/kg", change: "-0.5%", status: "Steady export flow" },
    { name: "Gujarat", price: "₹ 311/kg", change: "+0.9%", status: "Stable procurement" }
  ],
  articles: [
    {
      category: "Domestic Consumption",
      title: "Why India produces shrimp for the world but eats so little at home",
      summary: "A flagship editorial piece explaining the domestic opportunity and cultural barriers to shrimp consumption in India.",
      author: "Shrimp.News Desk",
      date: "Jul 10, 2026",
      readTime: "8 min read"
    },
    {
      category: "Health",
      title: "Shrimp is one of the healthiest proteins you can eat: here is why",
      summary: "Nutrition-led analysis of shrimp protein, low-calorie value, and its role in balanced diets.",
      author: "Aqua Insights",
      date: "Jul 08, 2026",
      readTime: "6 min read"
    },
    {
      category: "Farming",
      title: "The complete guide to vannamei shrimp farming from pond prep to harvest",
      summary: "A practical pillar article for pond preparation, stocking, feeding, water quality, and harvest planning.",
      author: "Aqua Field Team",
      date: "Jul 06, 2026",
      readTime: "10 min read"
    },
    {
      category: "Markets",
      title: "Understanding shrimp prices in India: what determines farmgate prices",
      summary: "A market intelligence article exploring size grading, supply and demand, export influence, and seasonal shifts.",
      author: "Market Desk",
      date: "Jul 04, 2026",
      readTime: "7 min read"
    },
    {
      category: "Technology",
      title: "Water quality is the foundation of every successful shrimp farm",
      summary: "A technology-led overview of the monitoring systems and water quality parameters that matter most.",
      author: "Tech Desk",
      date: "Jul 02, 2026",
      readTime: "5 min read"
    },
    {
      category: "Policy",
      title: "Export vs domestic market: which creates greater long-term stability",
      summary: "An analysis of export dependency, domestic opportunities, and the case for diversified market growth.",
      author: "Policy Desk",
      date: "Jun 30, 2026",
      readTime: "9 min read"
    }
  ],
  featureCards: [
    {
      title: "Ask AquaGPT",
      label: "AI online",
      description: "Ask a shrimp-focused assistant about disease, water, feed, prices, and market context.",
      cta: "Open chat",
      href: "pages/ask-aquaprana.html"
    },
    {
      title: "Aquaculture 101",
      label: "Learn",
      description: "Use the reference materials to build a practical learning experience around pond preparation and farm health.",
      cta: "Start learning",
      href: "pages/learn.html"
    },
    {
      title: "Events",
      label: "Calendar",
      description: "Track the shrimp industry events, conferences, and market briefings that matter for India.",
      cta: "Full calendar",
      href: "pages/events.html"
    }
  ],
  learningContent: [
    { title: "Pond preparation", description: "How to prepare a pond for successful stocking and good water conditions." },
    { title: "Water quality", description: "A guide to pH, dissolved oxygen, salinity, alkalinity, and how they shape survival outcomes." },
    { title: "Biosecurity", description: "Practical disease prevention habits for farms and hatcheries." }
  ],
  events: [
    { title: "Shrimp India Forum", date: "17 Aug 2026", location: "Hyderabad" },
    { title: "Aquaculture Supply Chain Summit", date: "11 Sep 2026", location: "Vizag" },
    { title: "Farm Health Briefing", date: "02 Oct 2026", location: "Chennai" }
  ],
  tools: [
    { title: "Price tracker", description: "Monitor farmgate price movements and weekly market changes." },
    { title: "Disease checklist", description: "Use a structured overview of common shrimp health conditions and signs." },
    { title: "Water quality planner", description: "Review key inputs such as pH, salinity, DO, and alkalinity." }
  ],
  aboutHighlights: [
    { title: "Mission", description: "Increase domestic shrimp awareness and consumption in India." },
    { title: "Coverage", description: "Prices, markets, farming, health, technology, and industry developments." },
    { title: "Editorial focus", description: "Article-first educational publishing built to serve the ecosystem." }
  ]
};
