import Image from "next/image";
import type { NewsSourceFigure } from "@/types";

const localScreenshotPath = /^\/images\/news\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/;
const recordId = /^[a-z0-9][a-z0-9-]{0,79}$/;

function publicSourceUrl(value: string): boolean {
  if (typeof value !== "string" || value !== value.trim() || [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return false;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function nonemptyText(value: string): boolean {
  return typeof value === "string" && Boolean(value.trim());
}

/** Fail closed for malformed coordinates, unsafe links and non-public image paths. */
export function isRenderableSourceFigure(figure: NewsSourceFigure): boolean {
  if (!figure || !recordId.test(figure.id) || !localScreenshotPath.test(figure.imageUrl)) return false;
  if (![figure.width, figure.height].every((value) => Number.isInteger(value) && value > 0 && value <= 16000)) return false;
  if (![figure.title, figure.alt, figure.caption, figure.sourceTitle].every(nonemptyText)) return false;
  if (!publicSourceUrl(figure.sourceUrl) || !nonemptyText(figure.capturedAt) || !Number.isFinite(Date.parse(figure.capturedAt))) return false;
  if (!Array.isArray(figure.annotations) || figure.annotations.length < 1 || figure.annotations.length > 8) return false;
  if (new Set(figure.annotations.map((annotation) => annotation?.id)).size !== figure.annotations.length) return false;

  return figure.annotations.every((annotation) => {
    if (!annotation || !recordId.test(annotation.id) || ![annotation.title, annotation.note].every(nonemptyText)) return false;
    const ellipse = annotation.ellipse;
    if (!ellipse || ![ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry].every(Number.isFinite)) return false;
    if (ellipse.rx <= 0 || ellipse.ry <= 0 || ellipse.cx - ellipse.rx < 0 || ellipse.cy - ellipse.ry < 0 || ellipse.cx + ellipse.rx > figure.width || ellipse.cy + ellipse.ry > figure.height) return false;
    const arrow = annotation.arrow;
    if (arrow && (![arrow.startX, arrow.startY, arrow.endX, arrow.endY].every(Number.isFinite) || [arrow.startX, arrow.endX].some((x) => x < 0 || x > figure.width) || [arrow.startY, arrow.endY].some((y) => y < 0 || y > figure.height))) return false;
    return Array.isArray(annotation.sourceLinks) && annotation.sourceLinks.length > 0 && annotation.sourceLinks.every((source) => source && nonemptyText(source.title) && publicSourceUrl(source.url));
  });
}

export default function ArticleSourceFigure({ figure }: { figure: NewsSourceFigure }) {
  if (!isRenderableSourceFigure(figure)) return null;
  const titleId = `source-figure-${figure.id}`;
  const captionId = `${titleId}-caption`;
  const arrowId = `${titleId}-arrow`;
  const captureDate = new Date(figure.capturedAt).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <figure data-source-figure={figure.id} aria-labelledby={titleId} aria-describedby={captionId} className="min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 id={titleId} className="text-lg font-bold leading-6 text-slate-950">{figure.title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">Captured <time dateTime={figure.capturedAt}>{captureDate}</time>.</p>
      </div>
      <div className="relative bg-white">
        <Image data-source-image={figure.id} src={figure.imageUrl} width={figure.width} height={figure.height} alt={figure.alt} unoptimized className="block h-auto w-full" />
        <svg data-source-overlay={figure.id} viewBox={`0 0 ${figure.width} ${figure.height}`} aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 h-full w-full">
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#b91c1c" />
            </marker>
          </defs>
          {figure.annotations.map((annotation) => {
            const { ellipse, arrow } = annotation;
            return (
              <g key={annotation.id}>
                <ellipse cx={ellipse.cx} cy={ellipse.cy} rx={ellipse.rx} ry={ellipse.ry} fill="none" stroke="#b91c1c" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                {arrow ? <line x1={arrow.startX} y1={arrow.startY} x2={arrow.endX} y2={arrow.endY} stroke="#b91c1c" strokeWidth="2.5" vectorEffect="non-scaling-stroke" markerEnd={`url(#${arrowId})`} /> : null}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption id={captionId} className="border-t border-slate-200 px-4 py-4">
        <p className="text-sm leading-6 text-slate-700">{figure.caption}</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">Screenshot excerpt from {figure.sourceTitle}. Circles and arrows are RepWatchr annotations; source pixels are unchanged. Numbered notes appear below.</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-blue-800">
          <a data-source-original={figure.id} href={figure.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Open original source <span className="sr-only">for {figure.title} (new tab)</span></a>
          <a href={figure.imageUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Open screenshot at full size <span className="sr-only">for {figure.title} (new tab)</span></a>
        </div>
        <ol className="mt-5 space-y-4" aria-label={`Editorial annotations for ${figure.title}`}>
          {figure.annotations.map((annotation, index) => (
            <li key={annotation.id} data-source-annotation={annotation.id} className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-red-700 text-sm font-bold text-red-800">{index + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-6 text-slate-950"><span className="sr-only">Annotation {index + 1}: </span>{annotation.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{annotation.note}</p>
                <ul className="mt-2 space-y-1" aria-label={`Sources for annotation ${index + 1}`}>
                  {annotation.sourceLinks.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm font-semibold leading-6 text-blue-800 underline underline-offset-4">{source.title}<span className="sr-only"> (new tab)</span></a></li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
