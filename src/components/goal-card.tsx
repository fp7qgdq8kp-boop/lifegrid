import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";

import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatGoalValue, formatPercent } from "@/lib/format";
import { calculateGoalProgress, completedMilestoneCount } from "@/lib/progress";
import type { GoalCardData } from "@/lib/types";

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  if (status === "ARCHIVED") return "default" as const;
  return "accent" as const;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function GoalCard({ goal }: { goal: GoalCardData }) {
  const progress = calculateGoalProgress(goal);
  const missingNextAction = !goal.nextAction?.trim();
  const completedMilestones = completedMilestoneCount(goal);
  const progressDetail =
    goal.goalType === "CHECKLIST"
      ? `${completedMilestones}/${goal.milestones.length} milestones`
      : `${formatGoalValue(goal.currentValue, goal.unit)} of ${formatGoalValue(goal.targetValue, goal.unit)}`;

  return (
    <Card
      className={
        missingNextAction
          ? "group h-full border-amber-300/20 bg-amber-400/[0.055] transition hover:-translate-y-0.5 hover:border-amber-200/35"
          : "group h-full transition hover:-translate-y-0.5 hover:border-cyan-400/20"
      }
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(goal.status)}>{humanize(goal.status)}</Badge>
              <Badge>{goal.pillar.name}</Badge>
              {missingNextAction ? <Badge variant="warning">Needs next action</Badge> : null}
            </div>
            <h3 className="mt-3 font-heading text-xl font-semibold text-white">{goal.title}</h3>
          </div>
          <Link
            href={`/goals/${goal.id}`}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {goal.description ? (
          <p className="line-clamp-2 text-sm leading-6 text-slate-300/70">{goal.description}</p>
        ) : (
          <p className="text-sm leading-6 text-slate-400">
            No description yet. Keep the goal sharp and actionable.
          </p>
        )}

        <ProgressBar
          value={progress}
          label={formatPercent(progress)}
          detail={progressDetail}
          showValue={false}
          tone={missingNextAction || goal.blocker ? "warning" : "default"}
        />

        <div className="space-y-2 text-sm text-slate-300/80">
          <div className="flex items-start gap-2">
            <Clock3
              className={
                missingNextAction ? "mt-0.5 h-4 w-4 text-amber-300" : "mt-0.5 h-4 w-4 text-slate-500"
              }
            />
            <p>
              {missingNextAction ? (
                <span className="text-amber-200">Needs a clear next action.</span>
              ) : (
                goal.nextAction
              )}
            </p>
          </div>
          {goal.blocker ? (
            <div className="flex items-start gap-2 text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
              <p>{goal.blocker}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              <p>No blocker logged.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
