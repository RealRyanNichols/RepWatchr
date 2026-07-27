import type { ReactNode } from "react";

type EditorialThumbnailVariant =
  | "breaking"
  | "federal"
  | "local"
  | "record"
  | "social"
  | "video";

interface EditorialThumbnailProps {
  message: string;
  eyebrow?: string;
  support?: string;
  variant?: EditorialThumbnailVariant;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  messageClassName?: string;
}

const variantClasses: Record<EditorialThumbnailVariant, string> = {
  breaking: "bg-[#5f0b12]",
  federal: "bg-[#071a36]",
  local: "bg-[#173a31]",
  record: "bg-slate-950",
  social: "bg-[#0b315a]",
  video: "bg-black",
};

const eyebrowClasses: Record<EditorialThumbnailVariant, string> = {
  breaking: "bg-red-700 text-white",
  federal: "bg-[#d9b65d] text-[#071a36]",
  local: "bg-[#c87443] text-white",
  record: "bg-white text-slate-950",
  social: "bg-sky-400 text-slate-950",
  video: "bg-red-700 text-white",
};

export default function EditorialThumbnail({
  message,
  eyebrow,
  support,
  variant = "record",
  children,
  className = "",
  contentClassName = "",
  messageClassName = "",
}: EditorialThumbnailProps) {
  return (
    <div
      data-editorial-thumbnail
      data-thumbnail-headline={message}
      className={`relative isolate overflow-hidden ${variantClasses[variant]} ${className}`}
    >
      {children ? <div className="absolute inset-0">{children}</div> : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.24)_38%,rgba(2,6,23,0.96)_100%)]"
      />
      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex flex-col items-start px-4 pb-4 pt-14 text-white sm:px-5 sm:pb-5 ${contentClassName}`}
      >
        {eyebrow ? (
          <span
            className={`mb-2 inline-flex px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${eyebrowClasses[variant]}`}
          >
            {eyebrow}
          </span>
        ) : null}
        <p
          className={`line-clamp-2 max-w-[24ch] text-balance text-xl font-black leading-[1.02] tracking-[-0.025em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-2xl ${messageClassName}`}
        >
          {message}
        </p>
        {support ? (
          <p className="mt-2 line-clamp-1 max-w-[48ch] text-xs font-bold text-white/80 sm:text-sm">
            {support}
          </p>
        ) : null}
      </div>
    </div>
  );
}
