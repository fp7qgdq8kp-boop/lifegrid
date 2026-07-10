import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActivityPageData } from "@/lib/data";

export default async function ActivityPage() {
  const activity = await getActivityPageData();

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
          History
        </p>
        <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
          See what changed.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
          History keeps plan changes, decisions, milestones, and check-ins in one running log.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent changes</CardTitle>
          <CardDescription>
            Plan creation, updates, milestones, and weekly check-ins all land here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed events={activity} />
        </CardContent>
      </Card>
    </div>
  );
}
