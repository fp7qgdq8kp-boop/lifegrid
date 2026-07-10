import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPillarsPageData } from "@/lib/data";

export default async function PillarsPage() {
  const pillars = await getPillarsPageData();

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
          Life areas
        </p>
        <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
          Keep the whole life in view.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
          Life areas help Jay and Skye see where active plans live without turning inactive areas
          into a score.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {pillars.map((pillar) => {
          const visiblePlans = pillar.goals.filter((goal) => goal.status !== "ARCHIVED");
          const attentionCount = visiblePlans.filter(
            (goal) => goal.status === "ACTIVE" && (!goal.nextAction?.trim() || goal.blocker?.trim())
          ).length;

          return (
            <Card key={pillar.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{pillar.name}</CardTitle>
                    <CardDescription>{pillar.description}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">{visiblePlans.length} plans</Badge>
                    {attentionCount ? (
                      <Badge variant="warning">{attentionCount} need attention</Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visiblePlans.length ? (
                    visiblePlans.map((goal) => (
                      <Link
                        key={goal.id}
                        href={`/goals/${goal.id}`}
                        className="block rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.055]"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{goal.title}</p>
                          <Badge>{goal.status.toLowerCase()}</Badge>
                          {goal.blocker?.trim() || !goal.nextAction?.trim() ? (
                            <Badge variant="warning">Needs attention</Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300/75">
                          {goal.nextAction || "Choose one next step when this plan is ready to move."}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
                      No plans here yet. That is fine. Add one when this area needs active attention.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
