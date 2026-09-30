import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import WebVitals from "@/components/web-vitals";
import ScrollReveal from "@/components/scroll-reveal";
import "./globals.css";
import { getRequestLocale } from "@/lib/request-locale";

const GA_MEASUREMENT_ID = "G-JMWRTDVZ9D";
const siteUrl = "https://fonts.blissbiovn.com";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Bliss Fonts — Curated Font Library", template: "%s | Bliss Fonts" },
  description: "Discover, preview and download international and Vietnamese fonts with clear licensing.",
  applicationName: "Bliss Fonts",
  keywords: ["Vietnamese fonts", "font Việt hóa", "Google Fonts", "free fonts", "design fonts"],
  authors: [{ name: "Bliss Fonts" }],
  creator: "Bliss Fonts",
  alternates: { canonical: siteUrl },
  manifest: "/site.webmanifest",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: { type: "website", locale: "en_US", url: siteUrl, siteName: "Bliss Fonts", title: "Bliss Fonts — Curated Font Library", description: "Discover and preview international and Vietnamese fonts with clear licensing.", images: [{ url: "/og-bliss-fonts.png", width: 1536, height: 1024, alt: "Bliss Fonts font library" }] },
  twitter: { card: "summary_large_image", title: "Bliss Fonts — Curated Font Library", description: "Discover and preview international and Vietnamese fonts with clear licensing.", images: ["/og-bliss-fonts.png"] },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const titles = { en: "Bliss Fonts — Curated Font Library", vi: "Bliss Fonts — Thư viện font", zh: "Bliss Fonts — 字体库", fr: "Bliss Fonts — Bibliothèque de polices", es: "Bliss Fonts — Biblioteca de fuentes" };
  const descriptions = { en: "Discover, preview and download international and Vietnamese fonts with clear licensing.", vi: "Khám phá, xem trước và tải font quốc tế cùng font tiếng Việt với giấy phép rõ ràng.", zh: "探索、预览并下载授权清晰的国际字体和越南语字体。", fr: "Découvrez, prévisualisez et téléchargez des polices internationales et vietnamiennes avec des licences claires.", es: "Descubre, previsualiza y descarga fuentes internacionales y vietnamitas con licencias claras." };
  return { ...baseMetadata, title: { default: titles[locale], template: "%s | Bliss Fonts" }, description: descriptions[locale], alternates: { canonical: `${siteUrl}/?lang=${locale}`, languages: { en: `${siteUrl}/?lang=en`, vi: `${siteUrl}/?lang=vi`, zh: `${siteUrl}/?lang=zh`, fr: `${siteUrl}/?lang=fr`, es: `${siteUrl}/?lang=es`, "x-default": `${siteUrl}/?lang=en` } }, openGraph: { ...baseMetadata.openGraph, locale: locale === "vi" ? "vi_VN" : locale === "zh" ? "zh_CN" : locale === "fr" ? "fr_FR" : locale === "es" ? "es_ES" : "en_US", title: titles[locale], description: descriptions[locale] }, twitter: { ...baseMetadata.twitter, title: titles[locale], description: descriptions[locale] } };
}

export const viewport: Viewport = { themeColor: "#1d241f", colorScheme: "light" };

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Bliss Fonts",
  url: siteUrl,
  description: "A curated font library with Vietnamese support and clear licensing.",
  potentialAction: { "@type": "SearchAction", target: `${siteUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();
  return <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="flex min-h-full flex-col">{children}<ScrollReveal /><WebVitals /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" /><Script id="google-analytics" strategy="lazyOnload">{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}</Script></body></html>;
}
