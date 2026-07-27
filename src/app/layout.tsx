import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import PageViewTracker from "@/components/shared/PageViewTracker";
import MobileAppShell from "@/components/mobile/MobileAppShell";
import ReferralAttributionTracker from "@/components/referrals/ReferralAttributionTracker";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { jsonLd, organizationJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: {
    default: "RepWatchr - Public Officials on the Record",
    template: "%s | RepWatchr",
  },
  description:
    "Find public officials, school boards, votes, funding, red flags, and source-backed accountability records voters can inspect and share.",
  keywords: [
    "RepWatchr",
    "elected officials",
    "United States representatives",
    "Texas",
    "political scorecard",
    "voting record",
    "campaign finance",
    "representative tracker",
    "accountability",
    "transparency",
    "property tax",
    "water rights",
    "school board",
    "midterm elections",
    "election accountability",
    "public records",
    "authority watch",
    "source-backed stories",
  ],
  metadataBase: new URL("https://www.repwatchr.com"),
  applicationName: "RepWatchr",
  appleWebApp: {
    capable: true,
    title: "RepWatchr",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "https://www.repwatchr.com",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  category: "public accountability",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/repwatchr-logo-america-first.png", type: "image/png", sizes: "1254x1254" },
    ],
    apple: [{ url: "/images/repwatchr-logo-america-first.png", type: "image/png", sizes: "1254x1254" }],
  },
  openGraph: {
    title: "RepWatchr - Public Officials on the Record",
    description:
      "Find the official, inspect the record, submit a missing source, and share what voters need before the next meeting, vote, hearing, or election.",
    url: "https://www.repwatchr.com",
    siteName: "RepWatchr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "RepWatchr social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr - Public Officials on the Record",
    description:
      "Find officials, inspect votes, submit missing sources, and share source-backed accountability records.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06172f" },
    { media: "(prefers-color-scheme: dark)", color: "#06172f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f6f9fc] text-slate-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }}
        />
        <GoogleAnalytics />
        <PageViewTracker />
        <ReferralAttributionTracker />
        <AuthProvider>
          <Header />
          <main className="rw-patriot-shell flex-1">{children}</main>
          <Footer />
          <MobileAppShell />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
