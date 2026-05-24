import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import PageViewTracker from "@/components/shared/PageViewTracker";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "RepWatchr - Find, Grade, Source, Share",
    template: "%s | RepWatchr",
  },
  description:
    "Find public officials and school boards, follow the political attention feed, grade the record, submit missing sources, and share source-backed accountability profiles.",
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
    "political news feed",
    "political attention",
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
  openGraph: {
    title: "RepWatchr - Find, Grade, Source, Share",
    description:
      "Open the feed, read the story, grade the record, submit a missing source, and share what voters need before the next meeting, vote, hearing, or election.",
    url: "https://www.repwatchr.com",
    siteName: "RepWatchr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr America First cover photo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr - Find, Grade, Source, Share",
    description:
      "Follow the feed, find officials, grade the record, submit missing sources, and share accountability stories that keep people coming back.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
  robots: {
    index: true,
    follow: true,
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
        <GoogleAnalytics />
        <PageViewTracker />
        <AuthProvider>
          <Header />
          <main className="rw-patriot-shell flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
