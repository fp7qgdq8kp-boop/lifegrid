import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getPillarsPageData } from "@/lib/data";
import { formatPercent } from "@/lib/format";
import { calculateGoalProgress } from "@/lib/progress";

export default async function PillarsPage() {
  const pillars = await getPillarsPageData();

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
          Life pillars
        </p>
        <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
          Keep the whole life in view.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
          Pillars prevent progress from getting trapped in one lane. Each domain shows its own momentum and the goals carrying it.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {pillars.map((pillar) => (
          <Card key={pillar.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{pillar.name}</CardTitle>
                  <CardDescription>{pillar.description}</CardDescription>
                </div>
                <Badge variant={pillar.progress >= 50 ? "success" : "accent"}>
                  {formatPercent(pillar.progress)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={pillar.progress} />
              <div className="space-y-3">
                {pillar.goals.length ? (
                  pillar.goals.map((goal) => (
                    <Link
                      key={goal.id}
                      href={`/goals/${goal.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-cyan-400/20"
                    >
                      <div>
                        <p className="font-medium text-white">{goal.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{goal.status.toLowerCase()}</p>
                      </div>
                      <Badge variant="accent">{formatPercent(calculateGoalProgress(goal))}</Badge>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                    No goals in this pillar yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

