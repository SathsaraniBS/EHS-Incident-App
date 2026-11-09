import type { Severity, WeightSource } from "@/lib/rating";

const STYLES: Record<number, string> = {
  6: "bg-red-50 text-red-700 ring-red-200",
  5: "bg-orange-50 text-orange-700 ring-orange-200",
  4: "bg-amber-50 text-amber-800 ring-amber-200",
  3: "bg-slate-100 text-slate-700 ring-slate-200",
};

interface Props {
  severity?: Pick<Severity, "level" | "marks"> | null;
  source?: WeightSource;
  title?: string;
}

/** Small pill showing "CAT 06 / 20 marks", or "Manual" when no severity backs the weight. */
export default function SeverityBadge({ severity, source, title }: Props) {
  if (!severity || source === "manual") {
    return (
      <span
        title={title}
        className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
      >
        Manual weight
      </span>
    );
  }
  const style = STYLES[severity.level] ?? STYLES[3];
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      <span>CAT {String(severity.level).padStart(2, "0")}</span>
      <span className="font-normal opacity-80">{severity.marks} marks</span>
    </span>
  );
}
