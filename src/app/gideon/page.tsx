import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Faretta AI | RepWatchr",
  description:
    "Ask Faretta AI to search RepWatchr, find officials, collect research facts, and shape the next public-record question.",
};

export default async function LegacyAIPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const query = (params?.q ?? "").trim();
  redirect(query ? `/faretta-ai?q=${encodeURIComponent(query)}` : "/faretta-ai");
}
