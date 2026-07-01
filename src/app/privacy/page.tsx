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
        Last updated: July 1, 2026
      </p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            1. Information We Collect
          </h2>
          <p>
            <strong>Account Information:</strong> When you create an account, we
            collect your email address and password. If
            you verify your identity, we may collect your county, district,
            state, verification status, and duplicate-risk signals.
          </p>
          <p className="mt-2">
            <strong>Identity Verification:</strong> If you choose to verify your
            residency or voter/geographic eligibility, we may use a verification
            provider, a hashed identifier, or a manually reviewed status.{" "}
            <strong>We do not publish identity documents or store public ID images in public storage.</strong>{" "}
            Verification signals are used to reduce duplicate accounts and label
            whether feedback is constituent, in-district, in-state, or outside
            the relevant area.
          </p>
          <p className="mt-2">
            <strong>Votes and Comments:</strong> When you vote (approve/disapprove)
            on an official, answer a political feedback question, react to a
            vote, or post a comment, we store that data associated with your
            account. Individual votes and survey answers are not publicly
            displayed unless a feature clearly asks for public display consent.
            Aggregate totals and summaries may be shown.
          </p>
          <p className="mt-2">
            <strong>Reports:</strong> When you submit a report about incorrect
            information, we store the report content and optionally your email
            address for follow-up.
          </p>
          <p className="mt-2">
            <strong>Visitor Intelligence and Usage Data:</strong> We may create
            a temporary anonymous visitor profile to understand how people use
            public RepWatchr pages. This may include entry page, exit page,
            referral domain, device category, search terms typed into RepWatchr,
            public officials viewed, topics/issues/counties viewed, scroll depth,
            buttons clicked, shares, packet builds, downloads, and time spent on
            public pages. If you later create an account or log in, that
            anonymous RepWatchr visitor history may be connected to your account
            so your dashboard and our product analytics do not lose your prior
            activity. RepWatchr may turn those public-site actions into an
            interest profile for topics like Texas, school boards, campaign
            finance, open records, and election records so we can recommend
            stories, officials, races, watchlists, alerts, and digest topics.
            We do not store raw IP addresses or raw user-agent strings in the
            owned visitor intelligence tables, and we do not use tracking cookies
            for advertising purposes.
          </p>
          <p className="mt-2">
            RepWatchr uses analytics to understand which public-record tools people use,
            improve source review, and prioritize public accountability features.{" "}
            <strong>
              RepWatchr does not sell personal political-interest profiles or private watchlists.
            </strong>
          </p>
          <p className="mt-2">
            <strong>Data Access Inquiries:</strong> If you request data access,
            a custom report, a constituent panel, or a partnership, we collect
            the business contact details and use case you submit so we can
            follow up.
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
            <li>To create aggregate political sentiment, vote-reaction, issue-priority, and source-confidence summaries</li>
            <li>To remember public RepWatchr pages, officials, topics, shares, packet builds, downloads, and source actions connected to your visitor or member history</li>
            <li>To personalize recommended stories, officials, races, alerts, dashboard modules, email digest topics, and watchlist suggestions</li>
            <li>To prepare de-identified or aggregate political intelligence, custom reports, and research services</li>
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
            <li>We do NOT sell raw identity documents or public ID images</li>
            <li>We do NOT share your individual votes with anyone</li>
            <li>We do NOT publish individual political feedback unless you clearly consent to public display</li>
            <li>We do NOT sell personal political-interest profiles or private watchlists</li>
            <li>We do NOT use your data for political advertising</li>
            <li>We do NOT track you across other websites</li>
            <li>We do NOT share your email with third parties</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            4. Aggregate Political Data Reports
          </h2>
          <p>
            RepWatchr may sell or license aggregate, de-identified, source-backed
            political intelligence, such as district-level issue sentiment,
            vote-again intent, vote-reaction summaries, source-count reports,
            profile completeness, funding-trail summaries, and custom public
            record research. These reports should not include raw private
            identity documents, private addresses, minor-child data, or individual
            account-level political responses unless you have clearly consented
            to public display or a specific use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            5. Data Security
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
            6. Your Rights
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
            7. Third-Party Services
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
            8. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Changes will be
            posted on this page with an updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            9. Contact
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
