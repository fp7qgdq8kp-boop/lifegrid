import { startOfWeek, format } from "date-fns";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Target } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { NextMoveActions } from "@/components/next-move-actions";
import { WeeklyReviewForm } from "@/components/weekly-review-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyReviewPageData } from "@/lib/data";
import { formatDate } from "@/lib/format";

type WeeklyReviewData = Awaited<ReturnType<typeof getWeeklyReviewPageData>>;
type WeeklyReviewNextMove = WeeklyReviewData["weeklyReviewNextMoves"][number];

function getPriorityVariant(priority: WeeklyReviewNextMove["priority"]) {
  if (priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "accent" as const;
}

function WeeklyReviewMoveCard({ move }: { move: WeeklyReviewNextMove }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getPriorityVariant(move.priority)}>{move.priority}</Badge>
        <Badge variant="accent">{move.pillarName}</Badge>
        <Badge>{move.category.replaceAll("_", " ")}</Badge>
      </div>
      <p className="mt-3 font-medium leading-6 text-white">{move.suggestion}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {move.goalTitle}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300/75">{move.reason}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <NextMoveActions
          goalId={move.goalId}
          suggestion={move.suggestion}
          category={move.category}
          className="contents"
        />
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/goals/${move.goalId}`}>
            Open plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export default async function WeeklyReviewPage() {
  const { reviews, stuckGoals, weeklyReviewNextMoves } = await getWeeklyReviewPageData();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
          Weekly check-in
        </p>
        <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
          Turn the week into signal.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
          Check-ins help the system stay honest: what moved, what got stuck, where focus goes
          next, and what should stop taking up oxygen.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capture this week</CardTitle>
            <CardDescription>
              The check-in doubles as a reset ritual and a data point for the timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyReviewForm weekStartDate={weekStart} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden border-cyan-300/10">
            <CardHeader className="border-b border-white/8 bg-cyan-400/[0.035]">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-100" />
                Suggested moves for next week
              </CardTitle>
              <CardDescription>
                The latest check-in translated into concrete plan actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {weeklyReviewNextMoves.length ? (
                weeklyReviewNextMoves.map((move) => (
                  <WeeklyReviewMoveCard
                    key={`${move.goalId}-${move.category}`}
                    move={move}
                  />
                ))
              ) : (
                <EmptyState
                  title="No check-in moves yet"
                  description="Save a weekly check-in and LifeGrid will turn its focus, friction, and cut-or-pause notes into suggested plan actions."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plans needing attention</CardTitle>
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
                  title="No stuck plans right now"
                  description="If blockers or missing next actions surface later, they will show here."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous check-ins</CardTitle>
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
                  title="No check-ins saved yet"
                  description="The first check-in creates a useful baseline for future weeks."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
