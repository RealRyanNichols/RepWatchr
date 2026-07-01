import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import PageViewTracker from "@/components/shared/PageViewTracker";
import NextActionRail from "@/components/civic/NextActions";
import { AnonymousWatchIntentConverter } from "@/components/civic/WatchButton";
import VisitorIntelligenceTracker from "@/components/shared/VisitorIntelligenceTracker";
import CommandPalette from "@/components/search/CommandPalette";
import { Analytics } from "@vercel/analytics/next";
import { getPageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "RepWatchr - Public Officials on the Record",
  description:
    "Find public officials, school boards, votes, funding, red flags, and source-backed accountability records voters can inspect and share.",
  path: "/",
  imagePath: "/api/og?type=home",
});

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    default: "RepWatchr - Public Officials on the Record",
    template: "%s | RepWatchr",
  },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <GoogleAnalytics />
        <PageViewTracker />
        <VisitorIntelligenceTracker />
        <AuthProvider>
          <AnonymousWatchIntentConverter />
          <CommandPalette />
          <Header />
          <main className="rw-patriot-shell flex-1">{children}</main>
          <NextActionRail />
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
