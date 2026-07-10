export const goalTypeOptions = [
  { value: "MONEY", label: "Money" },
  { value: "DEBT", label: "Debt" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "COUNT", label: "Count" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "RECURRING", label: "Recurring" }
] as const;

export const goalStatusOptions = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" }
] as const;

export const decisionLogCategoryValues = [
  "decision",
  "research",
  "option",
  "rejection",
  "note",
  "lesson"
] as const;

export const decisionLogStatusValues = [
  "active",
  "reconsidering",
  "rejected",
  "replaced",
  "archived"
] as const;

export const decisionLogCategoryOptions = [
  { value: "decision", label: "Decision" },
  { value: "research", label: "Research" },
  { value: "option", label: "Option" },
  { value: "rejection", label: "Rejection" },
  { value: "note", label: "Note" },
  { value: "lesson", label: "Lesson" }
] as const;

export const decisionLogStatusOptions = [
  { value: "active", label: "Active" },
  { value: "reconsidering", label: "Reconsidering" },
  { value: "rejected", label: "Rejected" },
  { value: "replaced", label: "Replaced" },
  { value: "archived", label: "Archived" }
] as const;

export const notificationTypeValues = [
  "partner_activity",
  "decision_created",
  "decision_updated",
  "milestone_completed",
  "plan_status_changed",
  "comment_added",
  "progress_log_added",
  "progress_threshold_reached",
  "review_requested",
  "review_request_resolved",
  "review_reminder_due",
  "system"
] as const;

export const notificationTypeOptions = [
  {
    value: "partner_activity",
    label: "Partner activity",
    description: "Shared plan updates that do not fit a more specific lane."
  },
  {
    value: "decision_created",
    label: "Decision added",
    description: "New decision logs, research notes, options, and rejections."
  },
  {
    value: "decision_updated",
    label: "Decision updated",
    description: "Decision edits, status changes, and archived decisions."
  },
  {
    value: "milestone_completed",
    label: "Milestones completed",
    description: "Checklist and milestone wins that move a plan forward."
  },
  {
    value: "plan_status_changed",
    label: "Plan status changes",
    description: "Plans moving between active, paused, completed, and archived."
  },
  {
    value: "comment_added",
    label: "Comments",
    description: "Discussion on plans, decisions, and milestones."
  },
  {
    value: "progress_log_added",
    label: "Progress updates",
    description: "Routine plan progress logs from household members."
  },
  {
    value: "progress_threshold_reached",
    label: "Progress thresholds",
    description: "Progress crossing 25%, 50%, 75%, or 100%."
  },
  {
    value: "review_requested",
    label: "Review requested",
    description: "A household member asks for review on a plan item."
  },
  {
    value: "review_request_resolved",
    label: "Review resolved",
    description: "Review requests that have been marked resolved."
  },
  {
    value: "review_reminder_due",
    label: "Review reminders",
    description: "Decision logs whose review date has arrived."
  },
  {
    value: "system",
    label: "System",
    description: "Important LifeGrid notices and operational updates."
  }
] as const;

export const navigation = [
  { href: "/", label: "Home", description: "Start here" },
  { href: "/goals", label: "Plans", description: "Next moves" },
  { href: "/pillars", label: "Life areas", description: "The big picture" },
  { href: "/weekly-review", label: "Check-in", description: "Weekly reset" },
  { href: "/notifications", label: "Updates", description: "Needs attention" },
  { href: "/activity", label: "History", description: "What changed" }
] as const;

export const pillarIconMap: Record<string, string> = {
  Money: "Wallet",
  "Home / Land": "House",
  Career: "BriefcaseBusiness",
  Business: "ChartColumnBig",
  Family: "Users",
  Health: "HeartPulse",
  Relationship: "HeartHandshake"
};
