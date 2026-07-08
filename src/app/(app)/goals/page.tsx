import { GoalFormDialog } from "@/components/goal-form-dialog";
import { GoalCard } from "@/components/goal-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGoalsPageData } from "@/lib/data";

export default async function GoalsPage() {
  const { goals, pillars } = await getGoalsPageData();
  const activeCount = goals.filter((goal) => goal.status === "ACTIVE").length;
  const pausedCount = goals.filter((goal) => goal.status === "PAUSED").length;
  const completedCount = goals.filter((goal) => goal.status === "COMPLETED").length;

  return (
    <div className="space-y-6 pb-10">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
            Goals
          </p>
          <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
            Keep the important work visible.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
            Goals are where long-range intention turns into trackable movement, real milestones, and next actions that can actually happen this week.
          </p>
        </div>
        <GoalFormDialog
          pillars={pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
          triggerLabel="New Goal"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Active
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold text-white">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Paused
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold text-white">{pausedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Completed
            </p>
            <p className="mt-3 font-heading text-3xl font-semibold text-white">{completedCount}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>All goals</CardTitle>
            <Badge variant="accent">{goals.length} total</Badge>
          </div>
          <CardDescription>
            Sorted by status and most recent movement so the live work stays near the top.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

