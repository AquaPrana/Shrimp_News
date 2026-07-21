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
  { label: "About Us", href: "/about" },
  { label: "Founder’s Message", href: "/founder" },
  { label: "Contact Us", href: "/contact" },
  { label: "Ask Prana", href: "/ask-aquaprana" },
];

export const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Articles", href: "/articles" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];
