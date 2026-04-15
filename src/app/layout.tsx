import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "RepWatchr",
    template: "%s | RepWatchr",
  },
  description:
    "RepWatchr - Track your elected officials. Scorecards, voting records, campaign funding, and red flags. Verified Texans can vote and comment publicly.",
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
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
