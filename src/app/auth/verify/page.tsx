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
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Verified profile</p>
          <h1 className="mt-2 text-2xl font-black text-emerald-950">Your community vote is enabled</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-900">
            Your verified residence area is held by the server and is used only to label community responses by constituency.
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
        <p className="text-xs font-black uppercase tracking-widest text-amber-700">Integrity upgrade in progress</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Secure voter-area verification is being rebuilt</h1>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
          RepWatchr has paused new community-vote verification while we replace the old self-certification flow with a server-verified process. We will not ask you to type a driver-license or state-ID number into this page.
        </p>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-sm font-black text-blue-950">What the replacement must guarantee</h2>
          <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-blue-900">
            <li>One verified person gets one response per profile or race.</li>
            <li>County, district, and state labels come from server-owned verification—not browser input.</li>
            <li>Identity evidence is minimized, access-controlled, auditable, and never shown publicly.</li>
            <li>Outside-area responses remain separate from constituent results.</li>
          </ul>
        </div>

        <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
          You can still use the dashboard, watch profiles, submit primary sources, and report corrections while verification is paused.
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
