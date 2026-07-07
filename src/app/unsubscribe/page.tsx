import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribe | RepWatchr",
  description: "RepWatchr digest unsubscribe helper.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Digest unsubscribe</p>
      <h1 className="mt-2 text-3xl font-black text-blue-950">Manage RepWatchr email preferences.</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {token
          ? "Token-based one-click unsubscribe is reserved for the future email sender. For now, log in and turn off digest consent from your dashboard."
          : "Log in and turn off digest consent from your dashboard. Email sending is disabled unless the server is explicitly configured."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard/notifications" className="primary-button">Open preferences</Link>
        <Link href="/privacy" className="secondary-button">Privacy rules</Link>
      </div>
    </main>
  );
}
