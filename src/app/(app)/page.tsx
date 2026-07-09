import Link from "next/link";
import { format, startOfWeek } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  Flag,
  HeartHandshake,
  HeartPulse,
  Home,
  Layers3,
  NotebookPen,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";

import { ActivityFeed } from "@/components/activity-feed";
import { EmptyState } from "@/components/empty-state";
import { GoalFormDialog } from "@/components/goal-form-dialog";
import { NextMoveActions } from "@/components/next-move-actions";
import { WeeklyReviewForm } from "@/components/weekly-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardData } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { calculateGoalProgress } from "@/lib/progress";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type DashboardPillar = DashboardData["pillars"][number];
type DashboardGoal = DashboardData["goals"][number];
type DashboardSuggestedMove = DashboardData["suggestedNextMoves"][number];

type PillarVisual = {
  icon: LucideIcon;
  accent: string;
  panel: string;
  glow: string;
};

const pillarVisuals: Record<string, PillarVisual> = {
  Money: {
    icon: Wallet,
    accent: "text-emerald-100 border-emerald-300/20 bg-emerald-400/10",
    panel: "from-emerald-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-emerald-950/30"
  },
  "Home / Land": {
    icon: Home,
    accent: "text-sky-100 border-sky-300/20 bg-sky-400/10",
    panel: "from-sky-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-sky-950/30"
  },
  Career: {
    icon: Briefcase,
    accent: "text-blue-100 border-blue-300/20 bg-blue-400/10",
    panel: "from-blue-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-blue-950/30"
  },
  Business: {
    icon: BarChart3,
    accent: "text-cyan-100 border-cyan-300/20 bg-cyan-400/10",
    panel: "from-cyan-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-cyan-950/30"
  },
  Family: {
    icon: Users,
    accent: "text-orange-100 border-orange-300/20 bg-orange-400/10",
    panel: "from-orange-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-orange-950/30"
  },
  Health: {
    icon: HeartPulse,
    accent: "text-rose-100 border-rose-300/20 bg-rose-400/10",
    panel: "from-rose-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-rose-950/30"
  },
  Relationship: {
    icon: HeartHandshake,
    accent: "text-fuchsia-100 border-fuchsia-300/20 bg-fuchsia-400/10",
    panel: "from-fuchsia-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-fuchsia-950/30"
  }
};

const defaultPillarVisual: PillarVisual = {
  icon: Layers3,
  accent: "text-cyan-100 border-cyan-300/20 bg-cyan-400/10",
  panel: "from-cyan-400/15 via-white/[0.035] to-transparent",
  glow: "shadow-cyan-950/30"
};

function getPillarVisual(name: string) {
  return pillarVisuals[name] ?? defaultPillarVisual;
}

function getActiveGoals(pillar: DashboardPillar) {
  return pillar.goals.filter((goal) => goal.status === "ACTIVE");
}

function getGoalSignal(goal: DashboardGoal) {
  if (goal.blocker?.trim()) {
    return {
      label: "Blocked",
      className: "text-amber-100",
      detail: goal.blocker
    };
  }

  if (!goal.nextAction?.trim()) {
    return {
      label: "Needs next action",
      className: "text-amber-100",
      detail: "No next action assigned yet."
    };
  }

  return {
    label: "Next",
    className: "text-slate-200",
    detail: goal.nextAction
  };
}

function CommandMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : tone === "warning"
        ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
        : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.045] p-4 shadow-panel backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300/75">{detail}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PillarCard({ pillar }: { pillar: DashboardPillar }) {
  const visual = getPillarVisual(pillar.name);
  const Icon = visual.icon;
  const activeGoals = getActiveGoals(pillar);
  const blockedGoals = activeGoals.filter((goal) => goal.blocker?.trim()).length;
  const missingActions = activeGoals.filter((goal) => !goal.nextAction?.trim()).length;
  const topGoals = activeGoals
    .map((goal) => ({
      goal,
      progress: calculateGoalProgress(goal)
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-card/80 p-4 shadow-panel ${visual.glow}`}
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${visual.panel}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className={`rounded-2xl border p-3 ${visual.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant={pillar.progress >= 50 ? "success" : pillar.progress ? "accent" : "default"}>
            {formatPercent(pillar.progress)}
          </Badge>
        </div>

        <div className="mt-4">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-white">
            {pillar.name}
          </h3>
          <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-300/75">
            {pillar.description}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            <span>{activeGoals.length} active</span>
            <span>{blockedGoals + missingActions} needs attention</span>
          </div>
          <Progress value={pillar.progress} />
        </div>

        <div className="mt-5 space-y-3">
          {topGoals.length ? (
            topGoals.map(({ goal, progress }) => (
              <Link
                key={goal.id}
                href={`/goals/${goal.id}`}
                className="block rounded-xl border border-white/8 bg-slate-950/35 p-3 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-white">{goal.title}</p>
                  <span className="text-xs text-cyan-100">{formatPercent(progress)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                  {goal.nextAction || "Needs a next action."}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/25 p-3 text-sm leading-6 text-slate-400">
              No active Bentley Family goal is attached here yet.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function getPriorityVariant(priority: DashboardSuggestedMove["priority"]) {
  if (priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "accent" as const;
}

function SuggestedMoveCard({
  suggestedMove,
  index
}: {
  suggestedMove: DashboardSuggestedMove;
  index: number;
}) {
  return (
    <article className="group rounded-2xl border border-white/8 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 font-heading text-sm font-semibold text-cyan-100">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getPriorityVariant(suggestedMove.priority)}>
              {suggestedMove.priority}
            </Badge>
            <Badge variant="accent">{suggestedMove.pillarName}</Badge>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-white">
            {suggestedMove.suggestion}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {suggestedMove.goalTitle}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300/75">{suggestedMove.reason}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {suggestedMove.category.replaceAll("_", " ")}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <NextMoveActions
              goalId={suggestedMove.goalId}
              suggestion={suggestedMove.suggestion}
              category={suggestedMove.category}
              className="contents"
            />
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/goals/${suggestedMove.goalId}`}>
                Open goal
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function StuckGoalCard({ goal }: { goal: DashboardGoal }) {
  const signal = getGoalSignal(goal);

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4 transition hover:border-amber-200/30 hover:bg-amber-400/15"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-2 text-amber-100">
          <Flag className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-white">{goal.title}</p>
            <Badge variant="warning">{signal.label}</Badge>
          </div>
          <p className="mt-2 text-sm text-amber-100/80">{goal.pillar.name}</p>
          <p className={`mt-3 text-sm leading-6 ${signal.className}`}>{signal.detail}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const activeGoalsWithNoNextAction = data.goalsMissingNextAction.length;
  const latestReview = data.reviews[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const pillarsNeedingAttention = data.pillars.filter((pillar) =>
    getActiveGoals(pillar).some((goal) => goal.blocker?.trim() || !goal.nextAction?.trim())
  ).length;
  const strongestPillar = [...data.pillars].sort((a, b) => b.progress - a.progress)[0];
  const quietPillars = data.pillars.filter((pillar) => getActiveGoals(pillar).length === 0).length;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.96)_52%,rgba(6,78,59,0.72))] p-5 shadow-panel sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-grid-fade opacity-35" />
        <div className="absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-7rem] h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1fr,320px] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Bentley Family</Badge>
              <Badge>{`${data.user.name}'s command view`}</Badge>
            </div>
            <h2 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Life command center
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200/80 sm:text-base">
              A calm operating board for money, home, career, business, family, health, and relationship. The only job here is to keep progress, blockers, and the next useful move visible.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <GoalFormDialog
                pillars={data.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
                triggerLabel="Create Goal"
              />
              <Button variant="secondary" asChild>
                <Link href="/weekly-review">
                  Open weekly review
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 backdrop-blur">
            <div className="flex items-center gap-5">
              <div
                className="grid h-28 w-28 shrink-0 place-items-center rounded-full p-2"
                style={{
                  background: `conic-gradient(rgb(34 211 238) ${data.overallProgress * 3.6}deg, rgb(255 255 255 / 0.08) 0deg)`
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-slate-950">
                  <div className="text-center">
                    <p className="font-heading text-2xl font-semibold text-white">
                      {formatPercent(data.overallProgress)}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      overall
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Operating picture</p>
                <p className="mt-2 text-sm leading-6 text-slate-300/75">
                  {data.activeGoals.length} active goals across {data.pillars.length} pillars.
                  {strongestPillar ? ` ${strongestPillar.name} is currently leading.` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CommandMetric
          label="Suggested moves"
          value={String(data.suggestedNextMoves.length)}
          detail={
            activeGoalsWithNoNextAction
              ? `${activeGoalsWithNoNextAction} goals need a next move.`
              : "Rule checks are keeping the next move visible."
          }
          tone={activeGoalsWithNoNextAction ? "warning" : "success"}
          icon={Target}
        />
        <CommandMetric
          label="Stuck goals"
          value={String(data.stuckGoals.length)}
          detail={
            data.stuckGoals.length
              ? "Blockers are visible and ready to clear."
              : "No active blockers are currently logged."
          }
          tone={data.stuckGoals.length ? "warning" : "success"}
          icon={AlertTriangle}
        />
        <CommandMetric
          label="Recent wins"
          value={String(data.recentWins.length)}
          detail="Completed milestones and weekly review wins."
          tone="success"
          icon={CircleCheckBig}
        />
        <CommandMetric
          label="Pillar coverage"
          value={`${data.pillars.length - quietPillars}/${data.pillars.length}`}
          detail={
            quietPillars
              ? `${quietPillars} pillars are waiting for active goals.`
              : "Every pillar has active attention."
          }
          icon={Layers3}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Pillars
            </p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
              Seven lanes, one operating system
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            {pillarsNeedingAttention
              ? `${pillarsNeedingAttention} pillars have blockers or missing next actions.`
              : "All active pillar lanes have clear next actions."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {data.pillars.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-white/8 bg-white/[0.025]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-100" />
                  Suggested Next Moves
                </CardTitle>
                <CardDescription>
                  Goal rules and weekly review signals translated into action.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/goals">
                  Goals
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {data.suggestedNextMoves.length ? (
              data.suggestedNextMoves.map((suggestedMove, index) => (
                <SuggestedMoveCard
                  key={`${suggestedMove.goalId}-${suggestedMove.category}-${index}`}
                  suggestedMove={suggestedMove}
                  index={index}
                />
              ))
            ) : (
              <EmptyState
                title="No suggested moves right now"
                description="Active goals with blockers, stale updates, missing progress, or deadline risk will appear here."
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="overflow-hidden border-amber-300/10">
            <CardHeader className="border-b border-white/8 bg-amber-400/[0.035]">
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-amber-100" />
                Stuck goal radar
              </CardTitle>
              <CardDescription>
                Blockers and missing next actions should never get to hide.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {data.stuckGoals.length ? (
                data.stuckGoals.map((goal) => <StuckGoalCard key={goal.id} goal={goal} />)
              ) : (
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-100" />
                    <div>
                      <p className="font-medium text-white">No active blockers.</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                        The Bentley Family board has clear next actions on every active goal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle className="flex items-center gap-2">
                <CircleCheckBig className="h-5 w-5 text-emerald-100" />
                Recent wins
              </CardTitle>
              <CardDescription>
                Evidence that the system is producing movement.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-white/8 bg-white/[0.025]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <NotebookPen className="h-5 w-5 text-cyan-100" />
                  Weekly review cockpit
                </CardTitle>
                <CardDescription>
                  Capture what moved, what got stuck, and where next week should point.
                </CardDescription>
              </div>
              <Badge variant={latestReview ? "success" : "warning"}>
                {latestReview ? "Review active" : "Needs first review"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 pt-6">
            {latestReview ? (
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
                  Latest review
                </p>
                <p className="mt-2 font-medium text-white">
                  Week of {formatDate(latestReview.weekStartDate)}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-emerald-50">Wins</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                      {latestReview.wins}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-50">Focus next week</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                      {latestReview.focusNextWeek}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-amber-100" />
                  <div>
                    <p className="font-medium text-white">Start the first review loop.</p>
                    <p className="mt-2 text-sm leading-6 text-amber-50/80">
                      Seeded goals are loaded. A weekly review gives the dashboard its operating rhythm.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <WeeklyReviewForm weekStartDate={weekStart} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-white/8 bg-white/[0.025]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-100" />
                  Recent movement
                </CardTitle>
                <CardDescription>
                  Goal creation, updates, milestones, and weekly review activity.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/activity">
                  Activity
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ActivityFeed events={data.activity} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
          <TrendingUp className="h-5 w-5 text-cyan-100" />
          <p className="mt-4 font-medium text-white">Balance the board</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Keep all seven Bentley Family pillars visible so life does not collapse into whichever fire is loudest.
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
          <Target className="h-5 w-5 text-cyan-100" />
          <p className="mt-4 font-medium text-white">Force the next move</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Every active goal should answer one question quickly: what is the next concrete action?
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
          <NotebookPen className="h-5 w-5 text-cyan-100" />
          <p className="mt-4 font-medium text-white">Review weekly</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The weekly review turns progress into memory, then memory into a better plan.
          </p>
        </div>
      </section>
    </div>
  );
}
