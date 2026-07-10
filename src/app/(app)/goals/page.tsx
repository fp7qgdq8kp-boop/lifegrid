import { Layers3 } from "lucide-react";

import { GoalFormDialog } from "@/components/goal-form-dialog";
import { GoalCard } from "@/components/goal-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoalsPageData } from "@/lib/data";

export default async function GoalsPage() {
  const { goals, pillars } = await getGoalsPageData();
  const activeCount = goals.filter((goal) => goal.status === "ACTIVE").length;
  const completedCount = goals.filter((goal) => goal.status === "COMPLETED").length;
  const missingNextActionCount = goals.filter(
    (goal) => goal.status === "ACTIVE" && !goal.nextAction?.trim()
  ).length;
  const blockedCount = goals.filter((goal) => goal.status === "ACTIVE" && goal.blocker?.trim())
    .length;
  const attentionCount = missingNextActionCount + blockedCount;

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.96)_52%,rgba(6,78,59,0.72))] p-5 shadow-panel sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-grid-fade opacity-35" />
        <div className="absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Plans</Badge>
              <Badge>{activeCount} active</Badge>
              <Badge variant="success">{completedCount} complete</Badge>
              {attentionCount ? <Badge variant="warning">{attentionCount} need attention</Badge> : null}
            </div>
            <h2 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Plans, without the clutter.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200/80 sm:text-base">
              A simple list of what Jay and Skye are moving, grouped by life area.
            </p>
          </div>
          <GoalFormDialog
            pillars={pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
            triggerLabel="Create Plan"
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Plans
            </p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
              Grouped by life area
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-slate-300">
            <Layers3 className="h-4 w-4 text-cyan-100" />
            {pillars.length} life areas
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
                      <Badge variant="accent">{activeGoals.length} plans</Badge>
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
                    title="No plans in this life area yet"
                    description="When this area needs attention, add one plan with a clear next step."
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
