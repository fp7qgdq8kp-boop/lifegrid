import Link from "next/link";
import { startOfWeek, format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CircleCheckBig,
  Flag,
  Layers3,
  Target,
  TrendingUp
} from "lucide-react";

import { ActivityFeed } from "@/components/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { GoalCard } from "@/components/goal-card";
import { GoalFormDialog } from "@/components/goal-form-dialog";
import { MetricCard } from "@/components/metric-card";
import { WeeklyReviewForm } from "@/components/weekly-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardData } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { calculateGoalProgress } from "@/lib/progress";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const activeGoalsWithNoNextAction = data.goalsMissingNextAction.length;
  const latestReview = data.reviews[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.95))] p-6 shadow-panel">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
              Dashboard
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
              What are we building next?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/75">
              LifeGrid keeps the Bentley Family pointed at high-leverage goals, visible blockers,
              and the next action that turns ambition into movement.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <GoalFormDialog
              pillars={data.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
              triggerLabel="Create Goal"
            />
            <Button variant="secondary" asChild>
              <Link href="/goals">
                Review all goals
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall progress"
          value={formatPercent(data.overallProgress)}
          detail={`${data.activeGoals.length} active goals across ${data.pillars.length} pillars`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="Next actions"
          value={String(data.nextActions.length)}
          detail={
            activeGoalsWithNoNextAction
              ? `${activeGoalsWithNoNextAction} goals still need a next action`
              : "Every active goal has a next action"
          }
          tone={activeGoalsWithNoNextAction ? "warning" : "success"}
          icon={<Target className="h-5 w-5" />}
        />
        <MetricCard
          label="Stuck goals"
          value={String(data.stuckGoals.length)}
          detail="Goals with blockers or missing next action"
          tone={data.stuckGoals.length ? "warning" : "success"}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          label="Recent wins"
          value={String(data.recentWins.length)}
          detail="Completed milestones and weekly reviews"
          tone="success"
          icon={<CircleCheckBig className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Progress by pillar</CardTitle>
            <CardDescription>
              Overall progress is the average of pillar progress. Each pillar reflects active goals only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.pillars.map((pillar) => {
              const activeGoalCount = pillar.goals.filter((goal) => goal.status === "ACTIVE").length;

              return (
                <div
                  key={pillar.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{pillar.name}</p>
                      <p className="text-sm text-slate-400">{activeGoalCount} active goals</p>
                    </div>
                    <Badge variant={pillar.progress >= 50 ? "success" : "accent"}>
                      {formatPercent(pillar.progress)}
                    </Badge>
                  </div>
                  <Progress value={pillar.progress} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly review prompt</CardTitle>
            <CardDescription>
              Capture the week so next actions stay grounded in what actually moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {latestReview ? (
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
                  Latest review
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  Week of {formatDate(latestReview.weekStartDate)}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">{latestReview.wins}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                No weekly review has been captured yet. Start with what moved, what got stuck, and where focus should land next.
              </div>
            )}
            <WeeklyReviewForm weekStartDate={weekStart} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <CardDescription>Every goal should leave the dashboard with a clear next move.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.nextActions.length ? (
              data.nextActions.map((goal) => (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="block rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{goal.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{goal.pillar.name}</p>
                    </div>
                    <Badge variant="accent">{formatPercent(calculateGoalProgress(goal))}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200/80">{goal.nextAction}</p>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No next actions yet"
                description="Create or update a goal and set the immediate next move."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stuck goals</CardTitle>
            <CardDescription>Blockers and missing actions surface here so they do not hide in the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.stuckGoals.length ? (
              data.stuckGoals.map((goal) => (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="block rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 transition hover:border-amber-300/30 hover:bg-amber-400/15"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{goal.title}</p>
                      <p className="mt-1 text-sm text-amber-100/80">{goal.pillar.name}</p>
                    </div>
                    <Flag className="h-4 w-4 text-amber-200" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-amber-50/90">
                    {goal.blocker?.trim() || "No next action assigned yet."}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState
                title="Nothing is currently flagged as stuck"
                description="As blockers are logged or next actions go missing, they will appear here."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active goals</CardTitle>
            <CardDescription>High-level snapshots of the work currently in motion.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.activeGoals.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.activeGoals.slice(0, 6).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No active goals yet"
                description="Create the first goal and start shaping the dashboard."
                action={
                  <GoalFormDialog
                    pillars={data.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
                    triggerLabel="Create first goal"
                  />
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Goal creation, updates, milestones, and review moments.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed events={data.activity} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent wins</CardTitle>
              <CardDescription>Small proof that momentum is real.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentWins.length ? (
                <ActivityFeed
                  events={data.recentWins}
                  emptyTitle="No wins yet"
                  emptyDescription="Complete a milestone or save a weekly review to seed this area."
                />
              ) : (
                <EmptyState
                  title="No wins logged yet"
                  description="Wins appear when milestones are completed or weekly reviews are saved."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Focus reminders</CardTitle>
            <CardDescription>
              Calm nudges that keep the system useful instead of decorative.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <Layers3 className="h-5 w-5 text-cyan-100" />
              <p className="mt-3 font-medium text-white">Keep pillars balanced</p>
              <p className="mt-2 text-sm text-slate-400">
                Money, home, work, business, family, health, and relationship should all stay visible.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <Target className="h-5 w-5 text-cyan-100" />
              <p className="mt-3 font-medium text-white">Force the next move</p>
              <p className="mt-2 text-sm text-slate-400">
                If a goal cannot answer “what next?”, it is not ready to stay active.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <CircleCheckBig className="h-5 w-5 text-cyan-100" />
              <p className="mt-3 font-medium text-white">Review weekly</p>
              <p className="mt-2 text-sm text-slate-400">
                Weekly review is how momentum becomes a system instead of a mood.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest review snapshot</CardTitle>
            <CardDescription>
              A quick read on the last captured weekly review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestReview ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Week starting
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatDate(latestReview.weekStartDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Wins</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300/75">{latestReview.wins}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Focus next week</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300/75">
                    {latestReview.focusNextWeek}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No weekly review yet"
                description="Save the first review to start building a clear narrative around what is moving."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
