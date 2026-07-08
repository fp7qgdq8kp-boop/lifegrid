import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
      <p className="font-heading text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300/70">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

