import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    template: "%s | RepWatchr",
  },
  description:
    "Track elected officials across the United States. Scorecards, voting records, campaign funding, red flags, school boards, and citizen questions.",
  keywords: [
    "RepWatchr",
    "elected officials",
    "United States",
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
  openGraph: {
    title: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    description:
      "Track elected officials across the United States with scorecards, voting records, campaign funding, red flags, school boards, and citizen questions.",
    url: "https://www.repwatchr.com",
    siteName: "RepWatchr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-brand-cover.jpg",
        width: 1200,
        height: 630,
        alt: "RepWatchr - Know Your Reps. Hold Them Accountable.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    description:
      "Track elected officials across the United States with scorecards, voting records, campaign funding, and red flags.",
    images: ["/images/repwatchr-brand-cover.jpg"],
  },
  icons: {
    icon: "/images/repwatchr-brand-profile.png",
    apple: "/images/repwatchr-brand-profile.png",
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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <GoogleAnalytics />
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
