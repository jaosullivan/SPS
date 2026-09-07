import type { Metadata, Viewport } from "next";
import { Cinzel, Source_Sans_3, Uncial_Antiqua } from "next/font/google";
import { SiteFrame } from "@/components/site-frame";
import { site } from "@/lib/site";
import "./globals.css";

const uncial = Uncial_Antiqua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-uncial",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Irish community since ${site.founded}`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.shortName,
  keywords: [
    "St. Patrick's Society",
    "Hong Kong",
    "Irish community",
    "Irish gala",
    "Green Card",
  ],
  authors: [{ name: site.name }],
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_HK",
    url: site.url,
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${site.name} crest`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/og.jpg"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b3d2c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${uncial.variable} ${cinzel.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink font-sans text-cream">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
