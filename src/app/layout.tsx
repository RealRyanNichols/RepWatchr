import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import PageViewTracker from "@/components/shared/PageViewTracker";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    default: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    template: "%s | RepWatchr",
  },
  description:
    "Track public officials nationwide with source-backed profiles, scorecards, voting records, campaign funding, public statements, and citizen input.",
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
  ],
  metadataBase: new URL("https://www.repwatchr.com"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/profile.png", type: "image/png", sizes: "1254x1254" },
    ],
    apple: [{ url: "/images/profile.png", type: "image/png", sizes: "1254x1254" }],
  },
  openGraph: {
    title: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    description:
      "Track elected officials with source-backed profiles, scorecards, voting records, campaign funding, red flags, and citizen input.",
    url: "https://www.repwatchr.com",
    siteName: "RepWatchr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/profile.png",
        width: 1254,
        height: 1254,
        alt: "RepWatchr - Know Your Reps. Hold Them Accountable.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    description:
      "Track elected officials with source-backed profiles, voting records, campaign funding, and red flags.",
    images: ["/images/profile.png"],
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
      <body className="min-h-full flex flex-col bg-[#06172f] text-slate-100">
        <GoogleAnalytics />
        <PageViewTracker />
        <AuthProvider>
          <Header />
          <main className="rw-patriot-shell flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
