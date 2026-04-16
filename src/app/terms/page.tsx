import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "RepWatchr terms of service - rules for using the platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: April 16, 2026
      </p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using RepWatchr (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            2. Description of Service
          </h2>
          <p>
            RepWatchr is a political transparency platform that tracks elected
            officials in Texas. The Service provides scorecards, voting records,
            campaign finance data, news articles, and a platform for verified
            Texas residents to vote on and discuss their elected officials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            3. User Accounts
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>One account per person -- creating multiple accounts is prohibited</li>
            <li>Identity verification requires a valid Texas Driver&apos;s License or State ID</li>
            <li>Fraudulent verification (using someone else&apos;s ID) will result in permanent ban</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            4. Voting Rules
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Only verified Texas residents may vote on elected officials</li>
            <li>One vote per person per official (you may change your vote at any time)</li>
            <li>Votes are anonymous -- only aggregate results are displayed publicly</li>
            <li>Any attempt to manipulate vote counts through fake accounts, bots, or other means will result in permanent ban and may be reported to authorities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            5. Comments and User Content
          </h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Comments are public and visible to all visitors</li>
            <li>You are responsible for the content you post</li>
            <li>Comments must be relevant to the elected official or political topic</li>
            <li>You retain ownership of your comments but grant RepWatchr a license to display them</li>
          </ul>
          <p className="mt-3 font-semibold text-gray-900">
            Prohibited content:
          </p>
          <ul className="list-disc list-inside space-y-1.5 mt-1.5">
            <li>Threats of violence or harm against any person</li>
            <li>Hate speech targeting race, religion, gender, or sexual orientation</li>
            <li>Doxxing or sharing private personal information (home addresses, phone numbers, family members)</li>
            <li>Spam, advertising, or commercial solicitation</li>
            <li>Deliberately false information presented as fact</li>
            <li>Impersonation of elected officials or other users</li>
          </ul>
          <p className="mt-3">
            We reserve the right to remove any content that violates these rules
            and to ban users who repeatedly violate them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            6. Data Accuracy
          </h2>
          <p>
            We strive to provide accurate, up-to-date information about elected
            officials. However, political data changes frequently and we cannot
            guarantee 100% accuracy at all times. We encourage users to report
            inaccuracies through our feedback system. Scores, grades, and
            analysis represent our editorial assessment based on publicly
            available voting records and are clearly tied to specific votes for
            full transparency.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            7. Non-Partisan Platform
          </h2>
          <p>
            RepWatchr is not affiliated with any political party, candidate, or
            campaign. Our scoring methodology is based on issue alignment, not
            party affiliation. Officials of any party receive credit for voting
            in the interest of their constituents.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            8. Intellectual Property
          </h2>
          <p>
            The RepWatchr name, logo, and original content are the property of
            RepWatchr. Public data sourced from government records remains in
            the public domain. You may share links to RepWatchr pages and
            reference our scores and data with attribution.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            9. Limitation of Liability
          </h2>
          <p>
            RepWatchr is provided &quot;as is&quot; without warranty of any kind.
            We are not liable for any damages arising from your use of the
            Service, including but not limited to decisions made based on the
            information provided.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            10. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your account at any
            time for violation of these terms. You may delete your account at
            any time through your dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            11. Changes to Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">
            12. Contact
          </h2>
          <p>
            Questions about these terms? Contact us at{" "}
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
