import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Shrimp.News | India shrimp intelligence and industry news",
  description:
    "Shrimp.News is an India-focused platform for shrimp consumption, prices, markets, farming, health, and technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        id="top"
        className="flex min-h-full flex-col overflow-x-hidden bg-white text-slate-800"
      >
        <LanguageProvider>
          <SiteHeader />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
