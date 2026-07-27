import Image, { type ImageProps } from "next/image";
import Link from "next/link";

export type EditorialOpeningFact = {
  label: string;
  value: number | string;
};

type EditorialOpeningProps = {
  eyebrow: string;
  title: string;
  question: string;
  summary: string;
  visual: {
    src: ImageProps["src"];
    alt: string;
    eyebrow?: string;
    headline?: string;
    caption?: string;
  };
  facts: readonly [
    EditorialOpeningFact,
    EditorialOpeningFact,
    EditorialOpeningFact?,
  ];
  primaryAction: {
    href: string;
    label: string;
  };
  imagePriority?: boolean;
};

function displayValue(value: number | string) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

export default function EditorialOpening({
  eyebrow,
  title,
  question,
  summary,
  visual,
  facts,
  primaryAction,
  imagePriority = false,
}: EditorialOpeningProps) {
  return (
    <section
      aria-labelledby="editorial-opening-title"
      className="overflow-hidden border-y border-slate-300 bg-[#fffdf8] shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
        <figure className="flex min-w-0 flex-col border-b border-slate-300 bg-slate-950 lg:border-r lg:border-b-0">
          <div className="relative min-h-[19rem] flex-1 overflow-hidden sm:min-h-[26rem] lg:min-h-[35rem]">
            <Image
              src={visual.src}
              alt={visual.alt}
              fill
              priority={imagePriority}
              sizes="(min-width: 1024px) 53vw, 100vw"
              className="object-cover"
            />
            {visual.eyebrow || visual.headline ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent px-5 pt-24 pb-6 text-white sm:px-7 sm:pb-8">
                {visual.eyebrow ? (
                  <p className="text-sm font-bold text-amber-300">
                    {visual.eyebrow}
                  </p>
                ) : null}
                {visual.headline ? (
                  <p className="mt-2 line-clamp-4 max-w-3xl font-serif text-2xl font-semibold leading-tight text-balance sm:text-4xl">
                    {visual.headline}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {visual.caption ? (
            <figcaption className="border-t border-white/15 bg-slate-950 px-5 py-3 text-xs leading-5 text-slate-300 sm:px-7">
              {visual.caption}
            </figcaption>
          ) : null}
        </figure>

        <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <p className="text-xs font-black tracking-[0.18em] text-red-700 uppercase">
            {eyebrow}
          </p>
          <h1
            id="editorial-opening-title"
            className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-[0.95] tracking-[-0.035em] text-slate-950 text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            {title}
          </h1>

          <p className="mt-7 border-l-4 border-red-700 pl-4 font-serif text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
            {question}
          </p>
          <p className="mt-5 max-w-[65ch] text-base font-medium leading-7 text-slate-700">
            {summary}
          </p>

          <dl className="mt-8 grid grid-cols-3 border-y border-slate-300">
            {facts.filter(Boolean).map((fact, index) => (
              <div
                key={fact!.label}
                className={`py-4 pr-4 ${
                  index > 0 ? "border-l border-slate-300 pl-4" : ""
                }`}
              >
                <dd className="font-serif text-3xl font-semibold text-slate-950">
                  {displayValue(fact!.value)}
                </dd>
                <dt className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  {fact!.label}
                </dt>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <Link
              href={primaryAction.href}
              className="inline-flex min-h-11 items-center justify-center bg-blue-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
            >
              {primaryAction.label}
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
