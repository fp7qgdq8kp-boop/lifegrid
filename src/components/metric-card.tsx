import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  tone,
  detail,
  icon
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "success" | "warning";
  icon: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {label}
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-300/70">{detail}</p>
          </div>
          <div
            className={
              tone === "success"
                ? "rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-emerald-100"
                : tone === "warning"
                  ? "rounded-2xl border border-amber-400/15 bg-amber-400/10 p-3 text-amber-100"
                  : "rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-100"
            }
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

