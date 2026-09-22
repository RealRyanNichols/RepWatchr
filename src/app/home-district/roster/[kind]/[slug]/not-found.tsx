import Link from "next/link";

export default function JurisdictionNotFound() {
  return (
    <div className="min-h-[55vh] bg-[#f5f1e8] px-5 py-16 text-[#111b24] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-[#a23a2b]">Jurisdiction not found</p>
        <h1 className="mt-5 font-[Fraunces] text-4xl font-semibold sm:text-6xl">This desk is not in the working list.</h1>
        <p className="mt-6 text-lg leading-8 text-slate-700">
          Open the local office explorer to find a county, city or town. An absent place is a gap to review, not a finding that it falls outside the coverage beat.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/home-district/roster" className="inline-flex min-h-12 items-center bg-[#111b24] px-5 py-3 text-white hover:bg-slate-700">Open the local office explorer</Link>
          <Link href="/submit-source" className="inline-flex min-h-12 items-center border border-[#a23a2b] px-5 py-3 text-[#a23a2b] hover:bg-white">Send a missing jurisdiction</Link>
        </div>
      </div>
    </div>
  );
}
