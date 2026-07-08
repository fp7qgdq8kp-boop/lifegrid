import { startOfWeek, format } from "date-fns";
import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { WeeklyReviewForm } from "@/components/weekly-review-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyReviewPageData } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function WeeklyReviewPage() {
  const { reviews, stuckGoals } = await getWeeklyReviewPageData();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
          Weekly review
        </p>
        <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
          Turn the week into signal.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
          Reviews help the system stay honest: what moved, what got stuck, where focus goes next, and what should stop taking up oxygen.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capture this week</CardTitle>
            <CardDescription>
              The review doubles as a reset ritual and a data point for the timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyReviewForm weekStartDate={weekStart} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stuck goals to review</CardTitle>
              <CardDescription>
                Bring these into the conversation so they do not drift quietly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stuckGoals.length ? (
                <div className="space-y-3">
                  {stuckGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-100" />
                        <p className="font-medium text-white">{goal.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-amber-100/90">
                        {goal.blocker || "No next action is set."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No stuck goals right now"
                  description="If blockers or missing next actions surface later, they will show here."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous reviews</CardTitle>
              <CardDescription>Browse the recent narrative of wins, friction, and focus.</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="accent">{formatDate(review.weekStartDate)}</Badge>
                        <p className="text-xs text-slate-400">{review.createdByUser.name}</p>
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300/75">
                        <p>
                          <span className="font-medium text-white">Wins:</span> {review.wins}
                        </p>
                        <p>
                          <span className="font-medium text-white">Stuck:</span> {review.stuckPoints}
                        </p>
                        <p>
                          <span className="font-medium text-white">Focus:</span> {review.focusNextWeek}
                        </p>
                        <p>
                          <span className="font-medium text-white">Cut or pause:</span> {review.cutOrPause}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No reviews saved yet"
                  description="The first review creates a useful baseline for future weeks."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

