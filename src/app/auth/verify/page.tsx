"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function VerifyPage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-slate-950">Sign in to verify your profile</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          RepWatchr ties verification to an account so one person cannot create multiple community votes.
        </p>
        <Link
          href="/auth/login"
          className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (profile?.verified) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Verified resident</p>
          <h1 className="mt-2 text-2xl font-black text-emerald-950">Your community participation is eligible</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-900">
            Your person and current residence checks are complete. This status does not claim that you are registered to vote; voter-registration matching is a separate assurance level.
          </p>
          <Link
            href="/officials"
            className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800"
          >
            Browse officials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-amber-700">Integrity pilot in progress</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Human and residence verification are being built as separate checks</h1>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
          RepWatchr has paused new community voting while the old self-certification flow is replaced. The pilot uses a specialist identity provider, a separate mailed residence check, and an accessible manual fallback. RepWatchr will not ask you to type a driver-license or state-ID number into this page.
        </p>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-sm font-black text-blue-950">Four honest assurance levels</h2>
          <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-blue-900">
            <li><strong>Confirmed account:</strong> control of an email account.</li>
            <li><strong>Verified person:</strong> identity and liveness or an equivalent manual review.</li>
            <li><strong>Verified resident:</strong> current address mapped to a jurisdiction and confirmed separately.</li>
            <li><strong>Registered voter:</strong> a separate, state-specific voter-file match that the pilot will not imply.</li>
          </ul>
        </div>

        <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
          No ID image, selfie, raw document number, birth date, or plaintext street address belongs in the RepWatchr database. Camera-free and manual-review paths will receive the same participation privileges. You can still use the dashboard, watch profiles, submit primary sources, and report corrections while voting is paused.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800"
          >
            Open dashboard
          </Link>
          <Link
            href="/submit-source"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50"
          >
            Submit a source
          </Link>
        </div>
      </div>
    </div>
  );
}
