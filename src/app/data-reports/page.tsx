import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found | RepWatchr",
};

export default function DataReportsPage() {
  notFound();
}
