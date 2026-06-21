import type { Metadata } from "next";
import SourceSubmissionThanksClient from "@/components/source-submissions/SourceSubmissionThanksClient";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const submissionId = firstParam(params.id) ?? "";

  return buildRepWatchrMetadata({
    title: "Source Submitted | RepWatchr",
    description: "RepWatchr source submission received for review with a copyable source packet.",
    path: submissionId ? `/submit-source/thanks?id=${encodeURIComponent(submissionId)}` : "/submit-source/thanks",
    imagePath: buildOgImageUrl("source-packet", { id: submissionId }),
    imageAlt: "RepWatchr submitted source packet preview",
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function SourceSubmissionThanksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const submissionId = firstParam(params.id) ?? "";

  return <SourceSubmissionThanksClient submissionId={submissionId} />;
}
