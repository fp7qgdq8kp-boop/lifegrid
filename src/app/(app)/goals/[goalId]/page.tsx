import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Plus,
  UserCircle2
} from "lucide-react";

import { completeMilestoneAction, createMilestoneAction } from "@/actions/lifegrid";
import { ActivityFeed } from "@/components/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { GoalFormDialog } from "@/components/goal-form-dialog";
import { ProgressUpdateDialog } from "@/components/progress-update-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { getGoalDetailData } from "@/lib/data";
import { formatDate, formatGoalValue, formatPercent, formatRelativeDate } from "@/lib/format";

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  return "accent" as const;
}

export default async function GoalDetailPage({
  params
}: {
  params: { goalId: string };
}) {
  const { goalId } = params;
  const data = await getGoalDetailData(goalId);

  if (!data) {
    notFound();
  }

  const { goal, progress, pillars, activity } = data;
  const missingNextAction = !goal.nextAction?.trim();

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(goal.status)}>{goal.status.toLowerCase()}</Badge>
              <Badge>{goal.pillar.name}</Badge>
              {missingNextAction ? <Badge variant="warning">Needs next action</Badge> : null}
            </div>
            <h2 className="font-heading text-4xl font-semibold text-white">{goal.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/75">
              {goal.description ||
                "No description yet. Capture the purpose behind this goal so future updates stay aligned."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ProgressUpdateDialog
              goalId={goal.id}
              currentValue={goal.currentValue}
              goalType={goal.goalType}
              nextAction={goal.nextAction}
              blocker={goal.blocker}
            />
            <GoalFormDialog
              pillars={pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
              goal={goal}
              triggerLabel="Edit goal"
              triggerVariant="outline"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-white">Progress</p>
            <p className="text-sm text-slate-300">{formatPercent(progress)}</p>
          </div>
          <Progress value={progress} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Next action and blocker</CardTitle>
              <CardDescription>
                Keep this pair current so the goal always knows what happens next.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div
                className={`rounded-2xl border p-4 ${
                  missingNextAction
                    ? "border-amber-400/20 bg-amber-400/10"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-cyan-100" />
                  <p className="font-medium text-white">Next action</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/80">
                  {goal.nextAction || "No next action has been set yet."}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  goal.blocker
                    ? "border-amber-400/20 bg-amber-400/10"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-100" />
                  <p className="font-medium text-white">Blocker</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/80">
                  {goal.blocker || "No blocker is currently logged."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Checklist goals derive progress from completed milestones. Other goals can still use milestones for structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.milestones.length ? (
                <div className="space-y-3">
                  {goal.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              milestone.status === "COMPLETED"
                                ? "success"
                                : milestone.status === "ACTIVE"
                                  ? "accent"
                                  : "default"
                            }
                          >
                            {milestone.status.toLowerCase()}
                          </Badge>
                          <p className="font-medium text-white">{milestone.title}</p>
                        </div>
                        {milestone.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-300/75">
                            {milestone.description}
                          </p>
                        ) : null}
                      </div>
                      {milestone.status !== "COMPLETED" ? (
                        <form action={completeMilestoneAction}>
                          <input type="hidden" name="milestoneId" value={milestone.id} />
                          <Button type="submit" variant="secondary" size="sm">
                            Complete
                          </Button>
                        </form>
                      ) : (
                        <p className="text-xs text-emerald-200/70">
                          Completed {formatRelativeDate(milestone.completedAt ?? milestone.updatedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No milestones yet"
                  description="Add milestones to break the goal down into smaller, visible wins."
                />
              )}

              <form action={createMilestoneAction} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <input type="hidden" name="goalId" value={goal.id} />
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cyan-100" />
                  <p className="font-medium text-white">Add milestone</p>
                </div>
                <div className="grid gap-3">
                  <Input name="title" placeholder="Milestone title" />
                  <Textarea
                    name="description"
                    placeholder="Optional detail to make the milestone more useful."
                    className="min-h-[96px]"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" variant="secondary">
                      Add milestone
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress history</CardTitle>
              <CardDescription>Each update creates a log so the movement tells a story over time.</CardDescription>
            </CardHeader>
            <CardContent>
              {goal.progressLogs.length ? (
                <div className="space-y-3">
                  {goal.progressLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        <Badge variant="accent">
                          {log.previousValue ?? 0} → {log.newValue ?? 0}
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
                  description="Use the progress update flow to capture movement, next action, and blockers together."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
              <CardDescription>Core details for this goal at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Current</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatGoalValue(goal.currentValue, goal.unit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Target</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatGoalValue(goal.targetValue, goal.unit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Deadline</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{formatDate(goal.deadline)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Owner</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{goal.ownerUser.name}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock3 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Updated</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatRelativeDate(goal.updatedAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
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
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Everything tied to this goal and its milestones.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                events={activity}
                emptyTitle="No activity for this goal yet"
                emptyDescription="Updates and milestone movement will appear here."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
              <CardDescription>Jump back into the rest of the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
