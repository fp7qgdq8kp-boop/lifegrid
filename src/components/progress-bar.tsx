import { cn } from "@/lib/utils";

type ProgressBarTone = "default" | "success" | "warning";

function getToneClass(tone: ProgressBarTone) {
  if (tone === "success") {
    return "from-emerald-300 via-emerald-400 to-cyan-400";
  }

  if (tone === "warning") {
    return "from-amber-300 via-orange-300 to-cyan-300";
  }

  return "from-cyan-300 via-sky-400 to-blue-500";
}

function getTrackClass(tone: ProgressBarTone) {
  if (tone === "warning") {
    return "bg-amber-950/50";
  }

  return "bg-white/8";
}

export function ProgressBar({
  value,
  label,
  detail,
  showValue = true,
  tone = "default",
  className
}: {
  value: number;
  label?: string;
  detail?: string;
  showValue?: boolean;
  tone?: ProgressBarTone;
  className?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div className={cn("space-y-2", className)}>
      {(label || detail || showValue) ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="min-w-0">
            {label ? <p className="font-medium text-white">{label}</p> : null}
            {detail ? <p className="truncate text-xs text-slate-400">{detail}</p> : null}
          </div>
          {showValue ? (
            <p className="shrink-0 font-medium text-slate-200">{Math.round(safeValue)}%</p>
          ) : null}
        </div>
      ) : null}
      <div className={cn("h-2.5 overflow-hidden rounded-full", getTrackClass(tone))}>
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-[0_0_20px_rgba(34,211,238,0.22)] transition-all",
            getToneClass(tone)
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
