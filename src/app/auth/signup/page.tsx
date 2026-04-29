"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const signupTools = [
  "Watch list for officials, boards, races, attorneys, media, and issues",
  "Free accountability packet builder",
  "Public-records request drafts and timeline starters",
  "Signal map for state buildout, source gaps, and review lanes",
];

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        await supabase.from("member_profiles").upsert(
          {
            user_id: data.session.user.id,
            display_name: normalizedEmail.split("@")[0],
            preferred_state: "TX",
            research_focus: "Politics, accountability, public records, and watched officials",
          },
          { onConflict: "user_id" }
        );
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Account creation failed. Check the member database configuration.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <h1 className="text-2xl font-black text-green-800">
            Account Created
          </h1>
          <p className="mt-2 text-green-700">
            Check your email if confirmation is required. Then sign in and you will land in the member dashboard.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
          <Link
            href="/dashboard"
            className="ml-3 mt-4 inline-block rounded-lg border border-green-300 bg-white px-5 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_52%,#fff7ed_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section>
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Founder access is open</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-blue-950 sm:text-5xl">
            Create the free member office before the network gets crowded.
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-blue-950/75">
            Start with email and password. Inside the dashboard you can follow targets, build records packets,
            draft public-records requests, use Faretta AI, and keep political research organized.
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-900">Free buildout window</p>
            <p className="mt-1 text-2xl font-black text-blue-950">90 days of founder access</p>
            <p className="mt-1 text-sm font-bold leading-6 text-blue-950/75">
              No paywall while the tools are being built into something people need.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {signupTools.map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-white p-4 text-sm font-black text-blue-950 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-blue-100/70 sm:p-8">
          <h2 className="text-2xl font-black text-gray-900">Create Account</h2>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            Join free. The member tools open immediately after signup.
          </p>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:bg-blue-400"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
