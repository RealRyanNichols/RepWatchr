import type { Metadata } from "next";
import Link from "next/link";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "For Candidates and Public Officials",
  description: "Request a free profile claim, submit an authentic photo and public sources, and explain your record. Every submission receives review before publication.",
  path: "/for-candidates",
  imagePath: buildOgImageUrl("methodology", { view: "candidate-profiles" }),
  imageAlt: "RepWatchr candidate and official profile requests",
});

export default function ForCandidatesPage() {
  return (
    <main className="rw-page-shell text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-slate-950 px-6 py-9 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Candidates and public officials · free to request</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">Help voters find your public record.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200">Request a profile claim, send a clear authentic photo, add official links and submit answers in your own words. RepWatchr reviews the material before it appears.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/officials" className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">Find your profile</Link><Link href="/profiles/claim?profileType=official" className="rounded-lg border border-slate-500 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Start a claim request</Link></div>
          <p className="mt-5 text-sm leading-6 text-slate-300">Open to candidates and officeholders of every party, including nonpartisan and school-board offices. No payment is required to request a claim.</p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="How profile requests work">
          {[
            ["01", "Find the right record", "Open your profile and choose “Claim this profile” to carry its details into the request. For a missing candidate, submit the official filing or election-authority link."],
            ["02", "Show your authority", "Create or sign into your account. Provide an official or campaign contact, a public proof link and a short explanation of your role."],
            ["03", "Submit for review", "A reviewer checks your authority separately from each statement or source. Approval to submit does not verify every claim or change the independent record."],
          ].map(([step, title, detail]) => <article key={step} className="rounded-xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-blue-800">{step}</p><h2 className="mt-3 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p></article>)}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Bring the material voters can check.</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600"><li>Your full name, office, district and election or current term.</li><li>A direct election-authority, government or campaign page establishing your role.</li><li>An original, recent portrait with your face clearly visible, plus its source and permission to use it. Send the largest authentic original available.</li><li>A concise biography, public links and source-backed answers. Candidate-supplied statements stay labeled.</li></ul>
            <p className="mt-5 text-sm leading-6 text-slate-600">Photos should be real and unaltered. Do not submit generated faces, beauty filters, private addresses, government ID numbers or information about children.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Your voice and the independent record.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">A claim can establish who is authorized to submit material. It is not an endorsement, election filing, ballot certification or verification of every statement.</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">Public records, sources, grades and research gaps remain under independent review. Payment cannot buy a better grade, remove sourced criticism or approve a claim.</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">Found an error or missing profile? Send the exact public source and what it corrects. Account access is not required to submit a source.</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-blue-800"><Link href="/submit-source" className="underline underline-offset-4">Submit a missing profile or correction</Link><Link href="/methodology" className="underline underline-offset-4">Read the review method</Link></div>
          </div>
        </section>
        <p className="mt-8 text-sm leading-6 text-slate-600">Current coverage varies by jurisdiction. <Link href="/coverage" className="font-bold text-blue-800 underline underline-offset-4">See what is loaded and what still needs review.</Link> Research teams can <Link href="/packages/public-data-api" className="font-bold text-blue-800 underline underline-offset-4">request a public-data pilot.</Link></p>
      </div>
    </main>
  );
}
