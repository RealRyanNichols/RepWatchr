"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

const EAST_TEXAS_COUNTIES = [
  "Anderson County",
  "Angelina County",
  "Bowie County",
  "Camp County",
  "Cass County",
  "Cherokee County",
  "Franklin County",
  "Gregg County",
  "Harrison County",
  "Henderson County",
  "Hopkins County",
  "Houston County",
  "Jasper County",
  "Lamar County",
  "Marion County",
  "Morris County",
  "Nacogdoches County",
  "Panola County",
  "Polk County",
  "Rains County",
  "Red River County",
  "Rusk County",
  "Sabine County",
  "San Augustine County",
  "Shelby County",
  "Smith County",
  "Titus County",
  "Trinity County",
  "Tyler County",
  "Upshur County",
  "Van Zandt County",
  "Wood County",
];

// Other Texas counties
const OTHER_TX_OPTION = "Other Texas County";

/**
 * Validate TX Driver's License format.
 * Texas DL numbers are 8 digits.
 */
function isValidTXDL(dl: string): boolean {
  return /^\d{8}$/.test(dl.replace(/\s/g, ""));
}

/**
 * Hash a string using SHA-256 (Web Crypto API).
 */
async function hashDL(dl: string): Promise<string> {
  const normalized = dl.replace(/\s/g, "");
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function VerifyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [dlNumber, setDlNumber] = useState("");
  const [county, setCounty] = useState("");
  const [otherCounty, setOtherCounty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Verify Your Identity
        </h1>
        <p className="mt-2 text-gray-600">
          You need to be logged in to verify your identity.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (profile?.verified) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8">
          <h1 className="text-2xl font-bold text-green-800">
            Already Verified
          </h1>
          <p className="mt-2 text-green-700">
            Your Texas identity has been verified. You can vote on elected
            officials.
          </p>
          <p className="mt-1 text-sm text-green-600">
            County: {profile.county}
          </p>
          <Link
            href="/officials"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Officials & Vote
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidTXDL(dlNumber)) {
      setError(
        "Invalid Texas Driver's License number. It should be 8 digits."
      );
      return;
    }

    const selectedCounty = county === OTHER_TX_OPTION ? otherCounty : county;

    if (!selectedCounty) {
      setError("Please select your county.");
      return;
    }

    setLoading(true);

    const dlHash = await hashDL(dlNumber);

    try {
      const response = await fetch("/api/member/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          county: selectedCounty,
          dlHash,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Account verification could not be saved.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Account verification could not reach the member database.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => window.location.assign("/dashboard"), 1200);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8">
          <h1 className="text-2xl font-bold text-green-800">
            Account Verified
          </h1>
          <p className="mt-2 text-green-700">
            Your RepWatchr account is now marked verified for this member area.
            The dashboard will show your verified status when it reloads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Verify Your Account
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          This connects your member account to a Texas county so votes,
          claims, profile ownership, and watch lists can be sorted correctly.
        </p>

        <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          <strong>Privacy:</strong> Your ID number is hashed (encrypted
          one-way) before storage. We never store or display your actual DL
          number. It is only used to prevent duplicate accounts.
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="dlNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Texas Driver&apos;s License / State ID Number
            </label>
            <input
              id="dlNumber"
              type="text"
              required
              value={dlNumber}
              onChange={(e) => setDlNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="12345678"
              maxLength={8}
              pattern="\d{8}"
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-gray-500">
              8-digit number found on your Texas DL or State ID
            </p>
          </div>

          <div>
            <label
              htmlFor="county"
              className="block text-sm font-medium text-gray-700"
            >
              County of Residence
            </label>
            <select
              id="county"
              required
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select your county...</option>
              <optgroup label="East Texas Counties">
                {EAST_TEXAS_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other">
                <option value={OTHER_TX_OPTION}>{OTHER_TX_OPTION}</option>
              </optgroup>
            </select>
          </div>

          {county === OTHER_TX_OPTION && (
            <div>
              <label
                htmlFor="otherCounty"
                className="block text-sm font-medium text-gray-700"
              >
                Enter Your Texas County
              </label>
              <input
                id="otherCounty"
                type="text"
                required
                value={otherCounty}
                onChange={(e) => setOtherCounty(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Dallas County"
              />
            </div>
          )}

          <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Important:</strong> Your county determines your
            &quot;in-district&quot; status when voting on officials. Votes from
            within an official&apos;s district are displayed separately from
            out-of-district votes, so campaigns and residents can see how
            constituents actually feel.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? "Verifying..." : "Verify My Identity"}
          </button>
        </form>
      </div>
    </div>
  );
}
