import type { Metadata } from "next";
import { SourceSubmissionSuccess } from "@/components/sources/SourceSubmission";

export const metadata: Metadata = {
  title: "Source Submitted | RepWatchr",
  description: "RepWatchr source submission confirmation and packet copy page.",
  robots: { index: false, follow: false },
};

export default async function SourceSubmittedPage({
  searchParams,
}: {
  searchParams?: Promise<{ submission?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  return <SourceSubmissionSuccess submissionId={params.submission} />;
}
