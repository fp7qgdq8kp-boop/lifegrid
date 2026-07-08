import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CircleCheckBig, Layers3, Target } from "lucide-react";

import { GoalFormDialog } from "@/components/goal-form-dialog";
import { GoalCard } from "@/components/goal-card";
import { EmptyState } from "@/components/empty-state";
import { PillarCard } from "@/components/pillar-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoalsPageData } from "@/lib/data";

function Metric({
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
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {label}
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300/70">{detail}</p>
          </div>
          <div className={`rounded-2xl border p-3 ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function GoalsPage() {
  const { goals, pillars } = await getGoalsPageData();
  const activeCount = goals.filter((goal) => goal.status === "ACTIVE").length;
  const completedCount = goals.filter((goal) => goal.status === "COMPLETED").length;
  const missingNextActionCount = goals.filter(
    (goal) => goal.status === "ACTIVE" && !goal.nextAction?.trim()
  ).length;
  const blockedCount = goals.filter((goal) => goal.status === "ACTIVE" && goal.blocker?.trim())
    .length;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.96)_52%,rgba(6,78,59,0.72))] p-5 shadow-panel sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-grid-fade opacity-35" />
        <div className="absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Goals</Badge>
              <Badge>{goals.length} total</Badge>
            </div>
            <h2 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Goal command board
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200/80 sm:text-base">
              Every Bentley Family goal grouped by pillar, with progress, blockers, and missing next
              actions surfaced before they can drift.
            </p>
          </div>
          <GoalFormDialog
            pillars={pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
            triggerLabel="Create Goal"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Active"
          value={String(activeCount)}
          detail="Goals currently moving through the system."
          icon={Target}
        />
        <Metric
          label="Missing next"
          value={String(missingNextActionCount)}
          detail="Active goals that need the next move clarified."
          icon={AlertTriangle}
          tone={missingNextActionCount ? "warning" : "success"}
        />
        <Metric
          label="Blocked"
          value={String(blockedCount)}
          detail="Active goals carrying an explicit blocker."
          icon={AlertTriangle}
          tone={blockedCount ? "warning" : "success"}
        />
        <Metric
          label="Completed"
          value={String(completedCount)}
          detail="Goals already landed or archived as wins."
          icon={CircleCheckBig}
          tone="success"
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Pillar overview
            </p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
              The life lanes at a glance
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Pillar cards summarize active goals, progress, blockers, and next-action gaps.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {pillars.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Grouped goals
            </p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
              Work grouped by pillar
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-slate-300">
            <Layers3 className="h-4 w-4 text-cyan-100" />
            {pillars.length} pillars
          </div>
        </div>

        {pillars.map((pillar) => {
          const activeGoals = pillar.goals.filter((goal) => goal.status !== "ARCHIVED");
          const attentionCount = activeGoals.filter(
            (goal) => goal.status === "ACTIVE" && (!goal.nextAction?.trim() || goal.blocker?.trim())
          ).length;

          return (
            <Card key={pillar.id} className="overflow-hidden">
              <CardHeader className="border-b border-white/8 bg-white/[0.025]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{pillar.name}</CardTitle>
                      <Badge variant="accent">{activeGoals.length} goals</Badge>
                      {attentionCount ? (
                        <Badge variant="warning">{attentionCount} need attention</Badge>
                      ) : null}
                    </div>
                    <CardDescription className="mt-2">{pillar.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {activeGoals.length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {activeGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No goals in this pillar yet"
                    description="When a goal is added to this pillar, it will appear here with progress and next action state."
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
