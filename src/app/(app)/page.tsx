import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Flag,
  ListChecks,
  Sparkles,
  Target
} from "lucide-react";

import { ActivityFeed } from "@/components/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { GoalFormDialog } from "@/components/goal-form-dialog";
import { NextMoveActions } from "@/components/next-move-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data";
import { formatRelativeDate } from "@/lib/format";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type DashboardGoal = DashboardData["goals"][number];
type DashboardSuggestedMove = DashboardData["suggestedNextMoves"][number];

function getPlanSignal(goal: DashboardGoal) {
  if (goal.blocker?.trim()) {
    return {
      label: "Blocked",
      detail: goal.blocker,
      tone: "warning" as const
    };
  }

  if (!goal.nextAction?.trim()) {
    return {
      label: "Needs next step",
      detail: "Choose one useful step so this plan can move.",
      tone: "warning" as const
    };
  }

  return {
    label: "Next step",
    detail: goal.nextAction,
    tone: "default" as const
  };
}

function PlanRow({ goal }: { goal: DashboardGoal }) {
  const signal = getPlanSignal(goal);

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-white/8 bg-white/[0.035] p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{goal.title}</p>
            <Badge variant="accent">{goal.pillar.name}</Badge>
            <Badge variant={signal.tone === "warning" ? "warning" : "default"}>
              {signal.label}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300/80">
            {signal.detail}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
      </div>
    </Link>
  );
}

function NextMoveCard({
  suggestedMove,
  priority = false
}: {
  suggestedMove: DashboardSuggestedMove;
  priority?: boolean;
}) {
  return (
    <article
      className={
        priority
          ? "rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-5"
          : "rounded-2xl border border-white/8 bg-white/[0.035] p-4"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={priority ? "accent" : "default"}>
          {suggestedMove.pillarName}
        </Badge>
        <Badge>{suggestedMove.category.replaceAll("_", " ")}</Badge>
      </div>
      <h3 className={priority ? "mt-4 text-xl font-semibold text-white" : "mt-3 font-semibold text-white"}>
        {suggestedMove.suggestion}
      </h3>
      <p className="mt-2 text-sm font-medium text-cyan-100/80">{suggestedMove.goalTitle}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300/80">{suggestedMove.reason}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <NextMoveActions
          goalId={suggestedMove.goalId}
          suggestion={suggestedMove.suggestion}
          category={suggestedMove.category}
          className="contents"
        />
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/goals/${suggestedMove.goalId}`}>
            Open plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const primarySuggestedMove = data.suggestedNextMoves[0];
  const additionalMoves = data.suggestedNextMoves.slice(1, 4);
  const needsAttention = data.stuckGoals.slice(0, 3);
  const recentPlans = [...data.activeGoals]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);
  const recentActivity = data.activity.slice(0, 3);
  const latestReview = data.reviews[0];
  const hasAttention = needsAttention.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-slate-950/75 p-5 shadow-panel sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-grid-fade opacity-25" />
        <div className="absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr,320px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{data.household.name}</Badge>
              <Badge>Viewing as {data.user.name}</Badge>
            </div>
            <h2 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Start with the next right move.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/80 sm:text-base">
              You do not need to organize everything today. Pick one useful step, keep the reason
              clear, and let LifeGrid hold the rest.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <GoalFormDialog
                pillars={data.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
                triggerLabel="Create Plan"
              />
              <Button variant="secondary" asChild>
                <Link href="/weekly-review">
                  Weekly check-in
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-sm font-medium text-white">At a glance</p>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-400">Active plans</span>
                <span className="font-semibold text-white">{data.activeGoals.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-400">Needs attention</span>
                <span className={hasAttention ? "font-semibold text-amber-100" : "font-semibold text-emerald-100"}>
                  {needsAttention.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-400">Recent updates</span>
                <span className="font-semibold text-white">{recentActivity.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-cyan-300/10">
            <CardHeader className="border-b border-white/8 bg-cyan-400/[0.035]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-100" />
                    Do this next
                  </CardTitle>
                  <CardDescription>The clearest next step across your active plans.</CardDescription>
                </div>
                <Badge variant={primarySuggestedMove ? "accent" : "success"}>
                  {primarySuggestedMove ? "Ready" : "Clear"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {primarySuggestedMove ? (
                <NextMoveCard suggestedMove={primarySuggestedMove} priority />
              ) : (
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-100" />
                    <div>
                      <p className="font-medium text-white">Nothing urgent is waiting.</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                        Use the weekly check-in to choose the next focus when you are ready.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {hasAttention ? (
            <Card className="overflow-hidden border-amber-300/10">
              <CardHeader className="border-b border-white/8 bg-amber-400/[0.035]">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-amber-100" />
                  Needs attention
                </CardTitle>
                <CardDescription>Only plans with blockers or missing next steps show here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {needsAttention.map((goal) => (
                  <PlanRow key={goal.id} goal={goal} />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-cyan-100" />
                    Your next moves
                  </CardTitle>
                  <CardDescription>Two or three useful options. Keep it light.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/goals">
                    View plans
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {additionalMoves.length ? (
                additionalMoves.map((suggestedMove) => (
                  <NextMoveCard
                    key={`${suggestedMove.goalId}-${suggestedMove.category}`}
                    suggestedMove={suggestedMove}
                  />
                ))
              ) : (
                <EmptyState
                  title="No extra moves right now"
                  description="LifeGrid will surface more once plans have blockers, check-ins, decisions, or stale next steps."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-cyan-100" />
                    Active plans
                  </CardTitle>
                  <CardDescription>Recently touched plans, not every life area at once.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/goals">
                    All plans
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {recentPlans.length ? (
                recentPlans.map((goal) => <PlanRow key={goal.id} goal={goal} />)
              ) : (
                <EmptyState
                  title="No active plans yet"
                  description="Start with one thing you and Skye are trying to move or figure out."
                />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-cyan-100" />
                    Weekly check-in
                  </CardTitle>
                  <CardDescription>Reflect when you are ready. The full form lives on Review.</CardDescription>
                </div>
                <Badge variant={latestReview ? "success" : "warning"}>
                  {latestReview ? "Started" : "Ready"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                {latestReview ? (
                  <>
                    <p className="text-sm font-medium text-white">
                      Last check-in was {formatRelativeDate(latestReview.createdAt)}.
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300/80">
                      Next focus: {latestReview.focusNextWeek}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-white">Your first check-in is ready.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300/80">
                      Capture what moved, what got stuck, and what should matter next.
                    </p>
                  </>
                )}
                <Button asChild className="mt-4 w-full">
                  <Link href="/weekly-review">
                    Start check-in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-100" />
                    Recent activity
                  </CardTitle>
                  <CardDescription>A short look at what changed.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/activity">
                    History
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ActivityFeed events={recentActivity} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
