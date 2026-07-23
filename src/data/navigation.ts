export type NavItem = {
  label: string;
  href: string;
};

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Domestic Consumption", href: "/domestic-consumption" },
  { label: "Shrimp Prices", href: "/prices" },
  { label: "Markets and Industry", href: "/markets-industry" },
  { label: "Shrimp Farming", href: "/farming" },
  { label: "Shrimp Health", href: "/health" },
  { label: "Technology", href: "/technology" },
  { label: "Articles", href: "/articles" },
  { label: "About", href: "/about" },
  { label: "Ask Prana", href: "/ask-aquaprana" },
];

export const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Articles", href: "/articles" },
  { label: "Contact", href: "/about#contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];
