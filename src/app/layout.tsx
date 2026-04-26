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
    "Track your elected officials in Texas. Scorecards, voting records, campaign funding, red flags, and citizen voting. The smartest way to watch your reps.",
  keywords: [
    "RepWatchr",
    "elected officials",
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
      { url: "/favicon.ico?v=20260425" },
      { url: "/icon.png?v=20260425", type: "image/png", sizes: "1254x1254" },
    ],
    apple: [{ url: "/apple-icon.png?v=20260425", type: "image/png", sizes: "1254x1254" }],
  },
  openGraph: {
    title: "RepWatchr - Know Your Reps. Hold Them Accountable.",
    description:
      "Track your elected officials in Texas. Scorecards, voting records, campaign funding, red flags, and citizen voting.",
    url: "https://www.repwatchr.com",
    siteName: "RepWatchr",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/icon.png?v=20260425",
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
      "Track your elected officials in Texas. Scorecards, voting records, campaign funding, and red flags.",
    images: ["/images/icon.png?v=20260425"],
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
