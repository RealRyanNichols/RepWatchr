import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faretta AI | RepWatchr",
  description: "Ask Faretta AI to search RepWatchr and find the public record, official, district, or school-board profile you need.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const query = (params?.q ?? "").trim();
  redirect(query ? `/faretta-ai?q=${encodeURIComponent(query)}` : "/faretta-ai");
}
