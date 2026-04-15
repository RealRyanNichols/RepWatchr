import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "About the RepWatchr - bringing transparency to local politics.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        About This Project
      </h1>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
          <p className="leading-relaxed">
            The RepWatchr exists because we believe every
            voter deserves to know exactly what their elected officials are
            doing -- how they vote, who funds them, and whether they keep their
            promises. Too often, this information is buried in government
            databases or simply not available. We bring it all together in one
            place, focused specifically on East Texas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Why East Texas?
          </h2>
          <p className="leading-relaxed">
            National scorecards exist, but they do not focus on the issues that
            matter most to our communities. Water rights along the Sabine River.
            Property rights and eminent domain. Local tax burdens. School board
            transparency. These are East Texas issues, and our officials should
            be held accountable on them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            What We Track
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                Every Level of Government
              </h3>
              <p className="text-sm text-gray-600">
                From US Congress (TX-1) and Texas Legislature (HD-7) down to
                county commissioners, city council, and school board members.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                Issue Scorecards
              </h3>
              <p className="text-sm text-gray-600">
                Grades on water rights, land rights, taxes, government
                transparency, and overall voting record alignment.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                Campaign Funding
              </h3>
              <p className="text-sm text-gray-600">
                Who is funding your officials? Top donors, industry sectors,
                and whether the money comes from inside or outside the
                district.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">Red Flags</h3>
              <p className="text-sm text-gray-600">
                Conflicts of interest, broken promises, and issues that voters
                should know about but may have been hidden or overlooked.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            School Board Transparency
          </h2>
          <p className="leading-relaxed">
            School board positions are elected positions, and the politics of
            the people making decisions about our children&apos;s education
            should be known. For too long, school board members have operated
            without the same scrutiny applied to other elected officials. We
            are changing that by tracking their positions, votes, and public
            stances on key education issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Data Sources
          </h2>
          <p className="leading-relaxed mb-3">
            All data comes from public records and official sources:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Federal Election Commission (FEC) - campaign finance</li>
            <li>Texas Ethics Commission (TEC) - state campaign finance</li>
            <li>Open States API - state legislative votes</li>
            <li>Congress.gov - federal legislative votes</li>
            <li>County and city official websites</li>
            <li>ISD websites and TEA - school board information</li>
            <li>Public meeting minutes and records</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            A Project by Ryan Nichols
          </h2>
          <p className="leading-relaxed">
            This tracker is built and maintained as a public service for East
            Texas communities. It is not affiliated with any political party or
            campaign.
          </p>
          <p className="mt-3">
            <a
              href="https://www.RealRyanNichols.com"
              className="text-blue-600 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.RealRyanNichols.com
            </a>
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/methodology"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            View Our Methodology
          </Link>
          <Link
            href="/officials"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Browse Officials
          </Link>
        </div>
      </div>
    </div>
  );
}
