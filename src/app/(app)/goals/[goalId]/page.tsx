import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Eye,
  FileText,
  Flag,
  ListChecks,
  MessageSquare,
  Send,
  Target,
  UserCircle2
} from "lucide-react";

import {
  archiveDecisionLogAction,
  resolveReviewRequestAction,
  submitCommentAction,
  submitReviewRequestAction
} from "@/actions/lifegrid";
import { ActivityFeed } from "@/components/activity-feed";
import { CompleteGoalButton } from "@/components/complete-goal-button";
import { CompleteMilestoneButton } from "@/components/complete-milestone-button";
import { DecisionLogFormDialog } from "@/components/decision-log-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { GoalFormDialog } from "@/components/goal-form-dialog";
import { MilestoneDetailDialog } from "@/components/milestone-detail-dialog";
import { MilestoneFormDialog } from "@/components/milestone-form-dialog";
import { NextMoveActions } from "@/components/next-move-actions";
import { ProgressBar } from "@/components/progress-bar";
import { ProgressUpdateDialog } from "@/components/progress-update-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getGoalDetailData } from "@/lib/data";
import { formatDate, formatGoalValue, formatRelativeDate } from "@/lib/format";
import {
  getMilestoneFieldDefinitions,
  getMilestoneSummary,
  hasMilestoneDetails
} from "@/lib/milestones";

type GoalDetailData = NonNullable<Awaited<ReturnType<typeof getGoalDetailData>>>;
type GoalRecommendedMove = NonNullable<GoalDetailData["recommendedNextMove"]>;

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  if (status === "ARCHIVED") return "default" as const;
  return "accent" as const;
}

function decisionLogStatusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "reconsidering") return "warning" as const;
  if (status === "rejected" || status === "replaced") return "danger" as const;
  return "default" as const;
}

function isPastReviewDate(value: Date | string | null) {
  if (!value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPriorityVariant(priority: GoalRecommendedMove["priority"]) {
  if (priority === "high") return "danger" as const;
  if (priority === "medium") return "warning" as const;
  return "accent" as const;
}

function CollapsibleGoalSection({
  id,
  title,
  description,
  icon,
  badge,
  defaultOpen = false,
  children
}: {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-[1.5rem] border border-white/8 bg-card/90 shadow-panel backdrop-blur-sm"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 transition hover:bg-white/[0.025] sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {badge}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180 group-hover:text-cyan-100" />
      </summary>
      <div className="border-t border-white/8 p-5 pt-5 sm:p-6">{children}</div>
    </details>
  );
}

export default async function GoalDetailPage({
  params
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = await params;
  const data = await getGoalDetailData(goalId);

  if (!data) {
    notFound();
  }

  const { goal, progress, pillars, activity, recommendedNextMove, householdMembers } = data;
  const missingNextAction = !goal.nextAction?.trim();
  const hasBlocker = Boolean(goal.blocker?.trim());
  const completedMilestones = goal.milestones.filter(
    (milestone) => milestone.status === "COMPLETED"
  ).length;
  const openMilestoneCount = goal.milestones.length - completedMilestones;
  const decisionLogs = [...goal.decisionLogs].sort(
    (a, b) =>
      Number(a.status === "archived") - Number(b.status === "archived") ||
      b.updatedAt.getTime() - a.updatedAt.getTime()
  );
  const reviewRequests = goal.reviewRequests;
  const openReviewRequests = reviewRequests.filter(
    (reviewRequest) => reviewRequest.status !== "resolved"
  );
  const resolvedReviewRequests = reviewRequests.filter(
    (reviewRequest) => reviewRequest.status === "resolved"
  );
  const targetOptions = [
    { value: "goal", label: "Whole plan" },
    ...decisionLogs
      .filter((decisionLog) => decisionLog.status !== "archived")
      .map((decisionLog) => ({
        value: `decision:${decisionLog.id}`,
        label: `Decision: ${decisionLog.title}`
      })),
    ...goal.milestones.map((milestone) => ({
      value: `milestone:${milestone.id}`,
      label: `Milestone: ${milestone.title}`
    }))
  ];
  const sectionLinks = [
    { href: "#recommended", label: "Start" },
    { href: "#decisions", label: "Decisions" },
    { href: "#milestones", label: "Milestones" },
    { href: "#notes", label: "Notes" },
    { href: "#history", label: "History" }
  ];

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.96)_52%,rgba(6,78,59,0.72))] p-5 shadow-panel sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-grid-fade opacity-35" />
        <div className="absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="relative">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/goals">
              <ChevronLeft className="h-4 w-4" />
              Back to plans
            </Link>
          </Button>

          <div className="mt-5 grid gap-6 xl:grid-cols-[1fr,360px] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(goal.status)}>{humanize(goal.status)}</Badge>
                <Badge>{goal.pillar.name}</Badge>
                {missingNextAction ? <Badge variant="warning">Needs next action</Badge> : null}
                {hasBlocker ? <Badge variant="warning">Blocked</Badge> : null}
              </div>
              <h2 className="mt-5 max-w-4xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {goal.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200/80 sm:text-base">
                {goal.description ||
                  "No description yet. This plan still needs a crisp explanation of why it matters and what good looks like."}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur">
              <ProgressUpdateDialog
                goalId={goal.id}
                currentValue={goal.currentValue}
                goalType={goal.goalType}
                nextAction={goal.nextAction}
                blocker={goal.blocker}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <CompleteGoalButton
                  goalId={goal.id}
                  isCompleted={goal.status === "COMPLETED"}
                  openMilestoneCount={openMilestoneCount}
                />
                <GoalFormDialog
                  pillars={pillars.map((pillar) => ({ id: pillar.id, name: pillar.name }))}
                  goal={goal}
                  triggerLabel="Edit Plan"
                  triggerVariant="outline"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-slate-950/45 p-5">
            <ProgressBar
              value={progress}
              label="Progress"
              detail={
                goal.goalType === "CHECKLIST"
                  ? `${completedMilestones}/${goal.milestones.length} milestones complete`
                  : `${formatGoalValue(goal.currentValue, goal.unit)} of ${formatGoalValue(
                      goal.targetValue,
                      goal.unit
                    )}`
              }
              tone={missingNextAction || hasBlocker ? "warning" : "default"}
            />
          </div>
        </div>
      </section>

      <nav
        aria-label="Plan sections"
        className="rounded-2xl border border-white/8 bg-slate-950/70 p-3 shadow-panel"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Jump to
          </p>
          <div className="flex flex-wrap gap-2">
            {sectionLinks.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-400/10 hover:text-cyan-100"
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <Card
        id="recommended"
        className={recommendedNextMove ? "overflow-hidden border-cyan-300/15" : "overflow-hidden"}
      >
        <CardHeader className="border-b border-white/8 bg-white/[0.025]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-100" />
                Recommended next move
              </CardTitle>
              <CardDescription>
                The top rule-based suggestion for this plan.
              </CardDescription>
            </div>
            {recommendedNextMove ? (
              <Badge variant={getPriorityVariant(recommendedNextMove.priority)}>
                {recommendedNextMove.priority}
              </Badge>
            ) : (
              <Badge variant="success">Clear</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recommendedNextMove ? (
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{recommendedNextMove.pillarName}</Badge>
                <Badge>{recommendedNextMove.category.replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-4 text-lg font-semibold text-white">
                {recommendedNextMove.suggestion}
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/75">
                {recommendedNextMove.reason}
              </p>
              <NextMoveActions
                goalId={recommendedNextMove.goalId}
                suggestion={recommendedNextMove.suggestion}
                category={recommendedNextMove.category}
                className="mt-5"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-5">
              <p className="font-medium text-white">No rule-based recommendation is firing.</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">
                This plan has no blocker, deadline risk, stale update, or missing setup signal
                right now.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
        <div className="space-y-6">
          <Card
            id="next-action"
            className={missingNextAction || hasBlocker ? "border-amber-300/15" : undefined}
          >
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan-100" />
                Next action and blocker
              </CardTitle>
              <CardDescription>
                The pair that decides whether this plan can move this week.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <div
                className={
                  missingNextAction
                    ? "rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                    : "rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                }
              >
                <div className="flex items-center gap-2">
                  <Clock3
                    className={
                      missingNextAction ? "h-4 w-4 text-amber-100" : "h-4 w-4 text-cyan-100"
                    }
                  />
                  <p className="font-medium text-white">Next action</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/80">
                  {goal.nextAction || "No next action has been set yet."}
                </p>
              </div>
              <div
                className={
                  hasBlocker
                    ? "rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                    : "rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                }
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={hasBlocker ? "h-4 w-4 text-amber-100" : "h-4 w-4 text-slate-500"}
                  />
                  <p className="font-medium text-white">Blocker</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/80">
                  {goal.blocker || "No blocker is currently logged."}
                </p>
              </div>
            </CardContent>
          </Card>

          <CollapsibleGoalSection
            id="notes"
            title="Notes and review"
            description="Open this when you need comments, partner check-ins, or review requests."
            icon={<MessageSquare className="h-5 w-5 text-cyan-100" />}
            badge={
              openReviewRequests.length ? (
                <Badge variant="warning">{openReviewRequests.length} open</Badge>
              ) : null
            }
            defaultOpen={Boolean(openReviewRequests.length)}
          >
            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <form
                  action={submitCommentAction}
                  className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                >
                  <input type="hidden" name="goalId" value={goal.id} />
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-100" />
                    <p className="font-medium text-white">Add comment</p>
                  </div>
                  <label
                    htmlFor="comment-target"
                    className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                  >
                    Target
                  </label>
                  <select
                    id="comment-target"
                    name="target"
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                  >
                    {targetOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-950">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Textarea
                    name="body"
                    className="mt-3 min-h-[108px]"
                    placeholder="Add context, a question, or a note for the household."
                  />
                  <Button type="submit" className="mt-3 w-full">
                    <Send className="h-4 w-4" />
                    Post comment
                  </Button>
                </form>

                <form
                  action={submitReviewRequestAction}
                  className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.055] p-4"
                >
                  <input type="hidden" name="goalId" value={goal.id} />
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-cyan-100" />
                    <p className="font-medium text-white">Request review</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="review-target"
                        className="block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70"
                      >
                        Target
                      </label>
                      <select
                        id="review-target"
                        name="target"
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                      >
                        {targetOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-slate-950">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="review-assignee"
                        className="block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70"
                      >
                        Reviewer
                      </label>
                      <select
                        id="review-assignee"
                        name="assignedToUserId"
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                      >
                        <option value="" className="bg-slate-950">
                          Household
                        </option>
                        {householdMembers.map((member) => (
                          <option key={member.id} value={member.userId} className="bg-slate-950">
                            {member.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Input
                    name="title"
                    className="mt-3"
                    placeholder="Review zoning decision before we rank parcels"
                  />
                  <Textarea
                    name="message"
                    className="mt-3 min-h-[88px]"
                    placeholder="What should they look at or decide?"
                  />
                  <Input name="dueDate" type="date" className="mt-3" />
                  <Button type="submit" className="mt-3 w-full">
                    <Eye className="h-4 w-4" />
                    Request review
                  </Button>
                </form>
              </div>

              {openReviewRequests.length ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">Open review requests</p>
                    <Badge variant="warning">{openReviewRequests.length} open</Badge>
                  </div>
                  {openReviewRequests.map((reviewRequest) => (
                    <article
                      id={`review-${reviewRequest.id}`}
                      key={reviewRequest.id}
                      className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="warning">Needs review</Badge>
                            {reviewRequest.decisionLog ? (
                              <Badge>Decision</Badge>
                            ) : reviewRequest.milestone ? (
                              <Badge>Milestone</Badge>
                            ) : (
                              <Badge>Plan</Badge>
                            )}
                            {reviewRequest.assignedToUser ? (
                              <Badge variant="accent">
                                {reviewRequest.assignedToUser.name}
                              </Badge>
                            ) : null}
                          </div>
                          <h4 className="mt-3 font-semibold text-white">{reviewRequest.title}</h4>
                          {reviewRequest.message ? (
                            <p className="mt-2 text-sm leading-6 text-slate-300/85">
                              {reviewRequest.message}
                            </p>
                          ) : null}
                          <p className="mt-3 text-xs text-slate-400">
                            Requested by {reviewRequest.requestedByUser.name}{" "}
                            {formatRelativeDate(reviewRequest.createdAt)}
                            {reviewRequest.dueDate
                              ? ` • Due ${formatDate(reviewRequest.dueDate)}`
                              : ""}
                          </p>
                        </div>
                        <form action={resolveReviewRequestAction}>
                          <input
                            type="hidden"
                            name="reviewRequestId"
                            value={reviewRequest.id}
                          />
                          <Button type="submit" variant="secondary" size="sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Resolve
                          </Button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">Recent comments</p>
                  {resolvedReviewRequests.length ? (
                    <Badge>{resolvedReviewRequests.length} resolved reviews</Badge>
                  ) : null}
                </div>
                {goal.comments.length ? (
                  goal.comments.map((comment) => (
                    <article
                      id={`comment-${comment.id}`}
                      key={comment.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="accent">{comment.user.name}</Badge>
                        {comment.decisionLog ? (
                          <Badge>Decision: {comment.decisionLog.title}</Badge>
                        ) : comment.milestone ? (
                          <Badge>Milestone: {comment.milestone.title}</Badge>
                        ) : (
                          <Badge>Plan</Badge>
                        )}
                        <span className="text-xs text-slate-400">
                          {formatRelativeDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300/85">
                        {comment.body}
                      </p>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="No comments yet"
                    description="Comments will hold quick questions, partner notes, and review context without polluting the decision log."
                  />
                )}
              </div>
            </div>
          </CollapsibleGoalSection>

          <Card id="decisions">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-100" />
                    Decisions
                  </CardTitle>
                  <CardDescription>
                    A log of choices, research notes, rejected options, and review points for this
                    plan.
                  </CardDescription>
                </div>
                <DecisionLogFormDialog goalId={goal.id} triggerLabel="Add decision" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {decisionLogs.length ? (
                decisionLogs.map((decisionLog) => {
                  const reviewIsPast = isPastReviewDate(decisionLog.reviewDate);

                  return (
                    <article
                      id={`decision-${decisionLog.id}`}
                      key={decisionLog.id}
                      className={
                        decisionLog.status === "archived"
                          ? "rounded-2xl border border-white/8 bg-white/[0.02] p-4 opacity-75"
                          : "rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                      }
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="accent">{decisionLog.category}</Badge>
                            <Badge variant={decisionLogStatusVariant(decisionLog.status)}>
                              {decisionLog.status}
                            </Badge>
                            {reviewIsPast ? <Badge variant="warning">Review due</Badge> : null}
                          </div>
                          <h4 className="mt-3 text-lg font-semibold text-white">
                            {decisionLog.title}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <DecisionLogFormDialog
                            goalId={goal.id}
                            decisionLog={decisionLog}
                            triggerLabel="Edit"
                            triggerVariant="outline"
                            triggerSize="sm"
                          />
                          {decisionLog.status !== "archived" ? (
                            <form action={archiveDecisionLogAction}>
                              <input
                                type="hidden"
                                name="decisionLogId"
                                value={decisionLog.id}
                              />
                              <Button type="submit" variant="danger" size="sm">
                                <Archive className="h-4 w-4" />
                                Archive
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.055] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
                            Decision
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-200/85">
                            {decisionLog.decision}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Reason
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300/80">
                            {decisionLog.reason}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                        <span>
                          Review:{" "}
                          <span className={reviewIsPast ? "text-amber-100" : "text-slate-300"}>
                            {formatDate(decisionLog.reviewDate)}
                          </span>
                        </span>
                        <span>Created {formatRelativeDate(decisionLog.createdAt)}</span>
                        <span>Updated {formatRelativeDate(decisionLog.updatedAt)}</span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  title="No decisions logged yet"
                  description="Use Add decision to capture the first major choice, research note, rejected option, or lesson for this plan."
                />
              )}
            </CardContent>
          </Card>

          <Card id="milestones">
            <CardHeader className="border-b border-white/8 bg-white/[0.025]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-cyan-100" />
                    Milestones
                  </CardTitle>
                  <CardDescription>
                    Milestones are planning records: open them to review reasoning, evidence,
                    choices, and outcomes.
                  </CardDescription>
                </div>
                <MilestoneFormDialog goalId={goal.id} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {goal.milestones.length ? (
                goal.milestones.map((milestone, index) => {
                  const fieldDefinitions = getMilestoneFieldDefinitions(goal, milestone.title);
                  const summary = getMilestoneSummary(milestone, fieldDefinitions);
                  const milestoneHasDetails = hasMilestoneDetails(milestone);

                  return (
                  <div
                    id={`milestone-${milestone.id}`}
                    key={milestone.id}
                    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 font-heading text-sm font-semibold text-cyan-100">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-white">{milestone.title}</p>
                              <Badge
                                variant={
                                  milestone.status === "COMPLETED"
                                    ? "success"
                                    : milestone.status === "ACTIVE"
                                      ? "accent"
                                      : "default"
                                }
                              >
                                {humanize(milestone.status)}
                              </Badge>
                              {milestoneHasDetails ? (
                                <Badge variant="accent">Details saved</Badge>
                              ) : null}
                            </div>
                            <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/30 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Summary
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-300/85">
                                {summary}
                              </p>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                              <span>Updated {formatRelativeDate(milestone.updatedAt)}</span>
                              {milestone.status === "COMPLETED" ? (
                                <span className="text-emerald-200/75">
                                  Completed{" "}
                                  {formatRelativeDate(
                                    milestone.completedAt ?? milestone.updatedAt
                                  )}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                          <MilestoneDetailDialog
                            goalTitle={goal.title}
                            milestone={milestone}
                            fieldDefinitions={fieldDefinitions}
                            triggerLabel="Open / Review"
                            triggerVariant="secondary"
                          />
                          <MilestoneDetailDialog
                            goalTitle={goal.title}
                            milestone={milestone}
                            fieldDefinitions={fieldDefinitions}
                            triggerLabel="Edit Details"
                            initialMode="edit"
                            triggerVariant="outline"
                          />
                          <CompleteMilestoneButton
                            milestoneId={milestone.id}
                            hasSavedDetails={milestoneHasDetails}
                            isCompleted={milestone.status === "COMPLETED"}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="No milestones yet"
                  description="Milestones will hold decisions, notes, references, and outcomes for this plan."
                />
              )}
            </CardContent>
          </Card>

          <CollapsibleGoalSection
            id="history"
            title="Progress history"
            description="Open this when you want the detailed timeline of progress updates."
            icon={<Clock3 className="h-5 w-5 text-cyan-100" />}
            badge={goal.progressLogs.length ? <Badge>{goal.progressLogs.length} logs</Badge> : null}
          >
            {goal.progressLogs.length ? (
              <div className="space-y-3">
                {goal.progressLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                      <Badge variant="accent">
                        {log.previousValue ?? 0} to {log.newValue ?? 0}
                      </Badge>
                      <span>{formatRelativeDate(log.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300/75">
                      {log.note || "No note was added for this update."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No progress logs yet"
                description="Use Log update to capture the next movement on this plan."
              />
            )}
          </CollapsibleGoalSection>
        </div>

        <div className="space-y-6">
          <CollapsibleGoalSection
            id="snapshot"
            title="Plan details"
            description="Current value, deadline, owner, and sharing state."
            icon={<Flag className="h-5 w-5 text-cyan-100" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Current</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatGoalValue(goal.currentValue, goal.unit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Flag className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Target</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatGoalValue(goal.targetValue, goal.unit)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Deadline</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{formatDate(goal.deadline)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Owner</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{goal.ownerUser.name}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock3 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Updated</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatRelativeDate(goal.updatedAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]">Shared</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">
                  {goal.isShared ? "Household" : "Private"}
                </p>
              </div>
            </div>
          </CollapsibleGoalSection>

          <CollapsibleGoalSection
            id="activity"
            title="Recent activity"
            description="Open this when you want the full change trail for this plan."
            icon={<ListChecks className="h-5 w-5 text-cyan-100" />}
            badge={activity.length ? <Badge>{activity.length} events</Badge> : null}
          >
            <ActivityFeed
              events={activity}
              emptyTitle="No activity for this plan yet"
              emptyDescription="Updates and milestone movement will appear here."
            />
          </CollapsibleGoalSection>
        </div>
      </section>
    </div>
  );
}
