import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/format";
import type { ActivityEventWithUser } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function humanizeKey(value: string) {
  return value
    .replace(/[_.-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatActivityValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }

    return value.length > 90 ? `${value.slice(0, 87).trim()}...` : value;
  }

  if (Array.isArray(value)) {
    return value.length ? value.map(formatActivityValue).join(", ") : "None";
  }

  return JSON.stringify(value);
}

function getChangeRows(event: ActivityEventWithUser) {
  const oldValue = event.oldValue;
  const newValue = event.newValue;

  if (isRecord(oldValue) && isRecord(newValue)) {
    return [...new Set([...Object.keys(oldValue), ...Object.keys(newValue)])]
      .filter(
        (key) =>
          JSON.stringify(oldValue[key] ?? null) !== JSON.stringify(newValue[key] ?? null)
      )
      .slice(0, 5)
      .map((key) => ({
        label: humanizeKey(key),
        from: formatActivityValue(oldValue[key]),
        to: formatActivityValue(newValue[key])
      }));
  }

  if (oldValue !== null && oldValue !== undefined && newValue !== null && newValue !== undefined) {
    return [
      {
        label: "Value",
        from: formatActivityValue(oldValue),
        to: formatActivityValue(newValue)
      }
    ];
  }

  return [];
}

function getChangedFieldLabels(event: ActivityEventWithUser) {
  if (!isRecord(event.metadata) || !Array.isArray(event.metadata.changedFields)) {
    return [];
  }

  return event.metadata.changedFields
    .filter((field): field is string => typeof field === "string")
    .map(humanizeKey);
}

export function ActivityFeed({
  events,
  emptyTitle = "No activity yet",
  emptyDescription = "Once goals move, milestones land, or reviews are captured, the timeline will light up here."
}: {
  events: ActivityEventWithUser[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!events.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const changeRows = getChangeRows(event);
        const changedFieldLabels = getChangedFieldLabels(event);

        return (
          <div
            key={event.id}
            className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
          >
            <div className="mt-1 rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-2 text-cyan-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">{event.message}</p>
                <Badge variant="accent" className="text-[10px]">
                  {humanizeKey(event.action ?? event.eventType)}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {event.user?.name ?? "System"} • {formatRelativeDate(event.createdAt)}
              </p>

              {changedFieldLabels.length ? (
                <p className="mt-2 text-xs text-slate-500">
                  Changed: {changedFieldLabels.join(", ")}
                </p>
              ) : null}

              {changeRows.length ? (
                <div className="mt-3 space-y-2 rounded-xl border border-white/8 bg-slate-950/30 p-3">
                  {changeRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-2 text-xs text-slate-300 sm:grid-cols-[120px,1fr,1fr]"
                    >
                      <span className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {row.label}
                      </span>
                      <span className="rounded-lg bg-white/[0.035] px-2 py-1">
                        {row.from}
                      </span>
                      <span className="rounded-lg bg-cyan-400/10 px-2 py-1 text-cyan-100">
                        {row.to}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
