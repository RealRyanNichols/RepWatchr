import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "RepWatchr privacy policy - how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: April 16, 2026
      </p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            1. Information We Collect
          </h2>
          <p>
            <strong>Account Information:</strong> When you create an account, we
            collect your email address and password. If
            you verify your identity, we collect your county of residence.
          </p>
          <p className="mt-2">
            <strong>Identity Verification:</strong> If you choose to verify your
            Texas residency, we collect your Texas Driver&apos;s License or State
            ID number. This number is immediately hashed using SHA-256 encryption
            before storage. <strong>We never store your actual DL number.</strong>{" "}
            The hash is used solely to prevent duplicate accounts.
          </p>
          <p className="mt-2">
            <strong>Votes and Comments:</strong> When you vote (approve/disapprove)
            on an official or post a comment, we store that data associated with
            your account. Individual votes are never publicly displayed -- only
            aggregate totals are shown.
          </p>
          <p className="mt-2">
            <strong>Reports:</strong> When you submit a report about incorrect
            information, we store the report content and optionally your email
            address for follow-up.
          </p>
          <p className="mt-2">
            <strong>Usage Data:</strong> We may collect anonymized analytics data
            about how visitors use the site (pages visited, time spent) using
            privacy-respecting analytics tools. We do not use tracking cookies for
            advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>To create and manage your account</li>
            <li>To verify your Texas residency for voting eligibility</li>
            <li>To display aggregate approval ratings (never individual votes)</li>
            <li>To display your public comments with your chosen display name</li>
            <li>To process reports about incorrect information</li>
            <li>To improve the site and fix errors</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            3. What We Do NOT Do
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>We do NOT sell your personal information to anyone</li>
            <li>We do NOT share your individual votes with anyone</li>
            <li>We do NOT store your actual Driver&apos;s License number</li>
            <li>We do NOT use your data for political advertising</li>
            <li>We do NOT track you across other websites</li>
            <li>We do NOT share your email with third parties</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            4. Data Security
          </h2>
          <p>
            Your data is stored securely using Supabase, which provides
            enterprise-grade security with row-level security policies,
            encrypted connections, and regular security audits. Identity
            verification data (DL numbers) is cryptographically hashed and
            cannot be reversed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            5. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>Access the personal data we hold about you</li>
            <li>Delete your account and all associated data</li>
            <li>Change or remove your votes and comments at any time</li>
            <li>Opt out of any future communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            6. Third-Party Services
          </h2>
          <p>
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li><strong>Supabase:</strong> Authentication and database hosting</li>
            <li><strong>Vercel:</strong> Website hosting and deployment</li>
          </ul>
          <p className="mt-2">
            Each of these services has their own privacy policies. We encourage
            you to review them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Changes will be
            posted on this page with an updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            8. Contact
          </h2>
          <p>
            If you have questions about this privacy policy or want to exercise
            your data rights, contact us at{" "}
            <a
              href="https://www.RepWatchr.com/feedback"
              className="text-blue-600 hover:underline"
            >
              RepWatchr.com/feedback
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
