import type { Metadata } from "next";
import { IntakeSuccessPage } from "@/components/intake/FormComponents";

export const metadata: Metadata = {
  title: "Submission Received | RepWatchr",
  description: "RepWatchr intake confirmation, copyable packet summary, status, and next action.",
  robots: { index: false, follow: false },
};

export default async function IntakeThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ submission?: string; form?: string }>;
}) {
  const params = await searchParams;
  return <IntakeSuccessPage submissionId={params.submission} formKey={params.form} />;
}
