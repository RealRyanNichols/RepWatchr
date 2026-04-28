import { calculateLetterGrade, getScoreSurfaceStyle } from "@/lib/scoring";

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

interface LetterGradeBadgeProps {
  grade: string;
  score?: number;
  size?: "sm" | "md";
}

export default function LetterGradeBadge({
  grade,
  score,
  size = "md",
}: LetterGradeBadgeProps) {
  const displayGrade = typeof score === "number" ? calculateLetterGrade(score) : grade;
  const scoreStyle = typeof score === "number" ? getScoreSurfaceStyle(score) : undefined;
  const fallbackClasses = scoreStyle ? "" : "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-bold ${sizeClasses[size]} ${fallbackClasses}`}
      style={scoreStyle}
    >
      {displayGrade}
    </span>
  );
}
