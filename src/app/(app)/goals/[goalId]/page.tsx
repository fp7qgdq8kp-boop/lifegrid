import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Flag,
  ListChecks,
  Plus,
  Target,
  UserCircle2
} from "lucide-react";

import { ActionPlaceholderDialog } from "@/components/action-placeholder-dialog";
import { ActivityFeed } from "@/components/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoalDetailData } from "@/lib/data";
import { formatDate, formatGoalValue, formatRelativeDate } from "@/lib/format";

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

export default async function GoalDetailPage({
  params
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = await params;
  const data = await getGoalDetailData(goalId);

  if (!data) {
    notFound();
  }

  const { goal, progress, activity } = data;
  const missingNextAction = !goal.nextAction?.trim();
  const hasBlocker = Boolean(goal.blocker?.trim());
  const completedMilestones = goal.milestones.filter(
    (milestone) => milestone.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.96)_52%,rgba(6,78,59,0.72))] p-5 shadow-panel sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-grid-fade opacity-35" />
        <div className="absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="relative">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/goals">
              <ChevronLeft className="h-4 w-4" />
              Back to goals
            </Link>
          </Button>

          <div className="mt-5 grid gap-6 xl:grid-cols-[1fr,360px] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(goal.status)}>{humanize(goal.status)}</Badge>
                <Badge>{goal.pillar.name}</Badge>
                {missingNextAction ? <Badge variant="warning">Needs next action</Badge> : null}
                {hasBlocker ? <Badge variant="warning">Blocked</Badge> : null}
              </div>
              <h2 className="mt-5 max-w-4xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {goal.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200/80 sm:text-base">
                {goal.description ||
                  "No description yet. This goal still needs a crisp explanation of why it matters and what good looks like."}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur">
              <ActionPlaceholderDialog
                title="Update Progress"
                triggerLabel="Update Progress"
                description="This will become the workflow for logging progress, blockers, and the next move."
              >
                <p>
                  Placeholder for updating the current value, writing a progress note, and refreshing
                  the next action without changing seeded data yet.
                </p>
              </ActionPlaceholderDialog>
              <div className="grid grid-cols-2 gap-3">
                <ActionPlaceholderDialog
                  title="Edit Goal"
                  triggerLabel="Edit Goal"
                  triggerVariant="outline"
                  description="This will become the structured edit form for this goal."
                >
                  <p>
                    Placeholder for editing title, pillar, status, description, owner, deadline,
                    blocker, and next action.
                  </p>
                </ActionPlaceholderDialog>
                <ActionPlaceholderDialog
                  title="Add Milestone"
                  triggerLabel="Add Milestone"
                  triggerVariant="secondary"
                  description="This will become the flow for adding a milestone to this goal."
                >
                  <p>
                    Placeholder for adding a milestone title, optional detail, and order inside this
                    goal.
                  </p>
                </ActionPlaceholderDialog>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-slate-950/45 p-5">
            <ProgressBar
              value={progress}
              label="Progress"
              detail={
                goal.goalType === "CHECKLIST"
                  ? `${completedMilestones}/${goal.milestones.length} milestones complete`
                  : `${formatGoalValue(goal.currentValue, goal.unit)} of ${formatGoalValue(
                      goal.targetValue,
                      goal.unit
                    )}`
              }
              tone={missingNextAction || hasBlocker ? "warning" : "default"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
        <div className="space-y-6">
          <Card className={missingNextAction || hasBlocker ? "border-amber-300/15" : undefined}>
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-100" />
                Next action and blocker
              </CardTitle>
              <CardDescription>
                The pair that decides whether this goal can move this week.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div
                className={
                  missingNextAction
                    ? "rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                    : "rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                }
              >
                <div className="flex items-center gap-2">
                  <Clock3
                    className={
                      missingNextAction ? "h-4 w-4 text-amber-100" : "h-4 w-4 text-cyan-100"
                    }
                  />
                  <p className="font-medium text-white">Next action</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/80">
                  {goal.nextAction || "No next action has been set yet."}
                </p>
              </div>
              <div
                className={
                  hasBlocker
                    ? "rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                    : "rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                }
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={hasBlocker ? "h-4 w-4 text-amber-100" : "h-4 w-4 text-slate-500"}
                  />
                  <p className="font-medium text-white">Blocker</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/80">
                  {goal.blocker || "No blocker is currently logged."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-cyan-100" />
                    Milestones
                  </CardTitle>
                  <CardDescription>
                    Checklist goals derive progress from milestones. Other goals can still use them
                    as structure.
                  </CardDescription>
                </div>
                <ActionPlaceholderDialog
                  title="Add Milestone"
                  triggerLabel="Add Milestone"
                  triggerVariant="secondary"
                  description="This will become the milestone creation workflow."
                >
                  <p>
                    Placeholder for adding a milestone, assigning status, and placing it in the
                    sequence.
                  </p>
                </ActionPlaceholderDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {goal.milestones.length ? (
                goal.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 font-heading text-sm font-semibold text-cyan-100">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">{milestone.title}</p>
                            <Badge
                              variant={
                                milestone.status === "COMPLETED"
                                  ? "success"
                                  : milestone.status === "ACTIVE"
                                    ? "accent"
                                    : "default"
                              }
                            >
                              {humanize(milestone.status)}
                            </Badge>
                          </div>
                          {milestone.description ? (
                            <p className="mt-2 text-sm leading-6 text-slate-300/75">
                              {milestone.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {milestone.status === "COMPLETED" ? (
                        <p className="text-xs text-emerald-200/75">
                          Completed{" "}
                          {formatRelativeDate(milestone.completedAt ?? milestone.updatedAt)}
                        </p>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <Plus className="h-4 w-4" />
                          Update soon
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No milestones yet"
                  description="Milestones will break this goal into smaller, visible wins."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle>Progress history</CardTitle>
              <CardDescription>
                Each progress update will become a log entry for the goal timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {goal.progressLogs.length ? (
                <div className="space-y-3">
                  {goal.progressLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        <Badge variant="accent">
                          {log.previousValue ?? 0} to {log.newValue ?? 0}
                        </Badge>
                        <span>{formatRelativeDate(log.createdAt)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300/75">
                        {log.note || "No note was added for this update."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No progress logs yet"
                  description="The Update Progress button is ready as a placeholder for the next workflow pass."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle>Goal snapshot</CardTitle>
              <CardDescription>Core details for this goal at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Current</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatGoalValue(goal.currentValue, goal.unit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Flag className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Target</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatGoalValue(goal.targetValue, goal.unit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Deadline</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{formatDate(goal.deadline)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Owner</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{goal.ownerUser.name}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock3 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Updated</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatRelativeDate(goal.updatedAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Shared</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {goal.isShared ? "Household" : "Private"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Everything tied to this goal and its milestones.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ActivityFeed
                events={activity}
                emptyTitle="No activity for this goal yet"
                emptyDescription="Updates and milestone movement will appear here."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle>Navigation</CardTitle>
              <CardDescription>Jump back into the rest of the command center.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <Button asChild variant="secondary" className="w-full">
                <Link href="/goals">Back to all goals</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
