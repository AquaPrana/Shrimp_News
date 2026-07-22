import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Devanagari,
  Noto_Sans_Telugu,
} from "next/font/google";
import { LanguageProvider } from "@/context/language-context";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "Shrimp.News | India shrimp intelligence and industry news",
  description:
    "Shrimp.News is an India-focused platform for shrimp consumption, prices, markets, farming, health, and technology.",
  icons: {
  icon: [
    { url: "/favicon.ico" },
    { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
  ],
  shortcut: "/favicon.ico",
  apple: "/apple-touch-icon.png",
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansTelugu.variable} ${notoSansDevanagari.variable} h-full antialiased`}
    >
      <body
        id="top"
        className="flex min-h-full flex-col overflow-x-clip bg-white text-slate-800"
      >
        <LanguageProvider>
          <SiteHeader />
          <main className="min-w-0 flex-1 overflow-x-clip">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
