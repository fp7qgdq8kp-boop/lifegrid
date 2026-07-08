import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/format";
import type { ActivityEventWithUser } from "@/lib/types";

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
      {events.map((event) => (
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
                {event.eventType.replaceAll(".", " ")}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {event.user?.name ?? "System"} • {formatRelativeDate(event.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

