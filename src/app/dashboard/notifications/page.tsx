import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import DigestPreferencesPanel from "@/components/notifications/DigestPreferencesPanel";
import {
  ensureNotificationPreferences,
  generateDigestPreview,
  getEmailSendingStatus,
} from "@/lib/digest-notifications";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digest Notifications | RepWatchr",
  description: "Private RepWatchr digest preferences and watchlist preview.",
  robots: { index: false, follow: false },
};

export default async function DashboardNotificationsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Notifications offline</p>
        <h1 className="mt-2 text-3xl font-black text-blue-950">Supabase auth is required for digest preferences.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Email sending is still disabled unless `ENABLE_EMAIL_SENDING=true` and a provider is configured.
        </p>
        <Link href="/dashboard" className="primary-button mt-5">Back to dashboard</Link>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard/notifications");

  const [preferences, preview] = await Promise.all([
    ensureNotificationPreferences(user.id, user.email),
    generateDigestPreview(user.id),
  ]);

  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Member notifications</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">Digest and alert settings</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Keep useful civic updates flowing from your watchlist and submissions. No emails send unless consent and provider setup are both active.
          </p>
          <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-black text-blue-950">
            {getEmailSendingStatus()}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DigestPreferencesPanel initialPreferences={preferences} initialPreview={preview} />
      </section>
    </main>
  );
}
