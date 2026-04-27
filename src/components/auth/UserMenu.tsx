"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { user, profile, roles, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canReview = roles.includes("admin") || roles.includes("reviewer");
  const displayName = profile?.displayName?.trim() || user?.email?.split("@")[0] || "Member";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Log In
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-black text-blue-950 shadow-sm transition-colors hover:border-red-200 hover:bg-blue-50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-xs font-black text-white">
          {initials || "M"}
        </div>
        <span className="hidden max-w-32 truncate sm:inline">
          {displayName}
        </span>
        {profile?.verified && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
            Verified
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-xl shadow-blue-100/70">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="truncate text-sm font-black text-gray-950">{displayName}</p>
            <p className="truncate text-xs font-semibold text-gray-500">{user.email}</p>
            {profile?.county && (
              <p className="mt-1 text-xs font-semibold text-gray-500">{profile.county}</p>
            )}
            <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${
              profile?.verified ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
            }`}>
              {profile?.verified ? "Verified account" : "Verification needed"}
            </span>
          </div>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Dashboard
          </Link>
          <Link
            href="/auth/verify"
            className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Account Verification
          </Link>
          <Link
            href="/faretta-ai"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Faretta AI
          </Link>
          <Link
            href="/dashboard/claims"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            My Claims
          </Link>
          <Link
            href="/dashboard/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            href="/profiles/claim"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Claim Profile
          </Link>
          {canReview ? (
            <>
              <div className="my-1 border-t border-gray-100" />
              <Link
                href="/admin/claims"
                className="block px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                Claim Queue
              </Link>
              <Link
                href="/admin/content-review"
                className="block px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                Content Review
              </Link>
            </>
          ) : null}
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
