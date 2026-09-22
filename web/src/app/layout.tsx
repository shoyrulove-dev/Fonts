import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-JMWRTDVZ9D";
const siteUrl = "https://fonts.blissbiovn.com";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Bliss Fonts — Kho font tiếng Việt", template: "%s | Bliss Fonts" },
  description: "Khám phá, thử chữ và tìm font hỗ trợ tiếng Việt với license rõ ràng cho thiết kế và web.",
  applicationName: "Bliss Fonts",
  keywords: ["font tiếng Việt", "font Việt hóa", "Google Fonts", "font miễn phí", "font thiết kế"],
  authors: [{ name: "Bliss Fonts" }],
  creator: "Bliss Fonts",
  alternates: { canonical: siteUrl },
  manifest: "/site.webmanifest",
  themeColor: "#1d241f",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Bliss Fonts",
    title: "Bliss Fonts — Kho font tiếng Việt",
    description: "Khám phá và thử font hỗ trợ tiếng Việt với license rõ ràng.",
    images: [{ url: "/og-bliss-fonts.png", width: 1536, height: 1024, alt: "Bliss Fonts — kho font tiếng Việt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bliss Fonts — Kho font tiếng Việt",
    description: "Khám phá và thử font hỗ trợ tiếng Việt với license rõ ràng.",
    images: ["/og-bliss-fonts.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Bliss Fonts",
  url: siteUrl,
  description: "Catalog font hỗ trợ tiếng Việt với license rõ ràng.",
  potentialAction: { "@type": "SearchAction", target: `${siteUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
      </body>
    </html>
  );
}
