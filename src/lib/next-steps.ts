import { calculateGoalProgress } from "@/lib/progress";

export type NextStepPriority = "low" | "medium" | "high";

export const nextStepCategories = [
  "missing_next_action",
  "stale_goal",
  "blocked_goal",
  "missing_milestones",
  "deadline_risk",
  "missing_progress",
  "checklist_next_milestone",
  "completion_ready",
  "missing_decision_log",
  "missing_location_decision",
  "decision_review_due",
  "weekly_review_focus",
  "weekly_review_cut_or_pause"
] as const;

export type NextStepCategory = (typeof nextStepCategories)[number];

export type NextStepSuggestion = {
  goalId: string;
  goalTitle: string;
  pillarName: string;
  suggestion: string;
  reason: string;
  priority: NextStepPriority;
  category: NextStepCategory;
};

type NextStepGoal = {
  id: string;
  title: string;
  goalType: string;
  status: string;
  targetValue: number | null;
  currentValue: number | null;
  deadline: Date | string | null;
  nextAction: string | null;
  blocker: string | null;
  updatedAt: Date | string;
  pillar: {
    name: string;
  };
  description?: string | null;
  milestones: Array<{
    title: string;
    description?: string | null;
    status: string;
  }>;
  decisionLogs?: Array<{
    title: string;
    decision: string;
    reason: string;
    category: string;
    status: string;
    reviewDate: Date | string | null;
  }>;
};

type WeeklyReviewLike = {
  weekStartDate: Date | string;
  wins: string;
  stuckPoints: string;
  focusNextWeek: string;
  cutOrPause: string;
  notes?: string | null;
};

const staleGoalDays = 14;
const deadlineRiskDays = 30;
const dayInMs = 24 * 60 * 60 * 1000;
const numericGoalTypes = new Set(["MONEY", "DEBT", "COUNT", "PERCENTAGE"]);
const nonActionableStatuses = new Set(["COMPLETED", "ARCHIVED"]);

const priorityRank: Record<NextStepPriority, number> = {
  high: 0,
  medium: 1,
  low: 2
};

const categoryRank: Record<NextStepCategory, number> = {
  blocked_goal: 0,
  completion_ready: 1,
  deadline_risk: 2,
  decision_review_due: 3,
  missing_location_decision: 4,
  weekly_review_focus: 5,
  missing_next_action: 6,
  missing_decision_log: 7,
  missing_progress: 8,
  stale_goal: 9,
  weekly_review_cut_or_pause: 10,
  missing_milestones: 11,
  checklist_next_milestone: 12
};

const stopWords = new Set([
  "and",
  "are",
  "for",
  "from",
  "into",
  "next",
  "not",
  "our",
  "the",
  "this",
  "that",
  "then",
  "with",
  "week",
  "what",
  "when",
  "where",
  "will",
  "you",
  "your"
]);

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / dayInMs);
}

function daysSince(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / dayInMs);
}

function formatDeadlineReason(daysUntilDeadline: number, progress: number) {
  if (daysUntilDeadline < 0) {
    return `Deadline passed ${Math.abs(daysUntilDeadline)} days ago and progress is ${Math.round(progress)}%.`;
  }

  if (daysUntilDeadline === 0) {
    return `Deadline is today and progress is ${Math.round(progress)}%.`;
  }

  return `Deadline is in ${daysUntilDeadline} days and progress is ${Math.round(progress)}%.`;
}

function normalizePillarName(name: string) {
  return name.trim().toLowerCase();
}

function normalizeSearchText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

function isActionable(goal: NextStepGoal) {
  return !nonActionableStatuses.has(goal.status);
}

function hasActiveLocationDecision(goal: NextStepGoal) {
  const locationTerms = [
    "area",
    "areas",
    "county",
    "counties",
    "location",
    "locations",
    "target",
    "dunnellon",
    "williston"
  ];

  return (goal.decisionLogs ?? []).some((decisionLog) => {
    if (decisionLog.status !== "active") {
      return false;
    }

    if (decisionLog.category !== "decision" && decisionLog.category !== "option") {
      return false;
    }

    const text = normalizeSearchText(
      `${decisionLog.title} ${decisionLog.decision} ${decisionLog.reason}`
    );

    return locationTerms.some((term) => text.includes(term));
  });
}

function formatReviewDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function sortNextStepSuggestions(a: NextStepSuggestion, b: NextStepSuggestion) {
  return (
    priorityRank[a.priority] - priorityRank[b.priority] ||
    categoryRank[a.category] - categoryRank[b.category] ||
    a.pillarName.localeCompare(b.pillarName) ||
    a.goalTitle.localeCompare(b.goalTitle)
  );
}

export function getNextStepSuggestions(
  goals: NextStepGoal[],
  now = new Date()
): NextStepSuggestion[] {
  const suggestions: NextStepSuggestion[] = [];

  for (const goal of goals) {
    if (!isActionable(goal)) {
      continue;
    }

    const progress = calculateGoalProgress(goal);
    const hasNextAction = Boolean(goal.nextAction?.trim());
    const hasBlocker = Boolean(goal.blocker?.trim());
    const isChecklist = goal.goalType === "CHECKLIST";
    const isActive = goal.status === "ACTIVE";
    const hasTargetValue = goal.targetValue !== null && goal.targetValue !== undefined;
    const missingCurrentValue = goal.currentValue === null || goal.currentValue === undefined;
    const pillarName = goal.pillar.name;
    const normalizedPillarName = normalizePillarName(pillarName);
    const decisionLogs = goal.decisionLogs ?? [];

    const addSuggestion = (
      suggestion: string,
      reason: string,
      priority: NextStepPriority,
      category: NextStepCategory
    ) => {
      suggestions.push({
        goalId: goal.id,
        goalTitle: goal.title,
        pillarName,
        suggestion,
        reason,
        priority,
        category
      });
    };

    if (hasBlocker) {
      addSuggestion(
        "Resolve the blocker or break it into the smallest unblock action.",
        `Current blocker: ${goal.blocker?.trim()}`,
        "high",
        "blocked_goal"
      );
    }

    if (isActive && progress >= 100) {
      addSuggestion(
        "Mark this goal completed or lower the progress if it is not actually done.",
        "This active goal is already showing 100% progress.",
        "high",
        "completion_ready"
      );
    }

    const deadline = toDate(goal.deadline);
    if (isActive && deadline && progress < 50) {
      const daysUntilDeadline = daysBetween(now, deadline);
      if (daysUntilDeadline <= deadlineRiskDays) {
        addSuggestion(
          "Re-scope the goal or choose a high-leverage next move before the deadline.",
          formatDeadlineReason(daysUntilDeadline, progress),
          "high",
          "deadline_risk"
        );
      }
    }

    if (isActive && !decisionLogs.length) {
      addSuggestion(
        "Log the first major decision or research note for this goal.",
        "Active goals need a decision trail so future reviews can explain what changed and why.",
        "medium",
        "missing_decision_log"
      );
    }

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const dueDecisionLog = decisionLogs
      .filter((decisionLog) => decisionLog.status !== "archived")
      .map((decisionLog) => ({
        ...decisionLog,
        parsedReviewDate: toDate(decisionLog.reviewDate)
      }))
      .filter(
        (decisionLog) =>
          decisionLog.parsedReviewDate !== null &&
          decisionLog.parsedReviewDate < startOfToday
      )
      .sort(
        (a, b) =>
          (a.parsedReviewDate?.getTime() ?? 0) - (b.parsedReviewDate?.getTime() ?? 0)
      )[0];

    if (dueDecisionLog?.parsedReviewDate) {
      addSuggestion(
        `Review the decision "${dueDecisionLog.title}".`,
        `Its review date was ${formatReviewDate(dueDecisionLog.parsedReviewDate)}.`,
        "high",
        "decision_review_due"
      );
    }

    if (!hasNextAction) {
      addSuggestion(
        "Define the smallest concrete next action.",
        "This goal does not have a next action assigned.",
        "medium",
        "missing_next_action"
      );
    }

    const updatedAt = toDate(goal.updatedAt);
    if (isActive && updatedAt) {
      const daysWithoutUpdate = daysSince(updatedAt, now);
      if (daysWithoutUpdate >= staleGoalDays) {
        addSuggestion(
          "Review, update, or pause this goal.",
          `This goal has not been updated in ${daysWithoutUpdate} days.`,
          "medium",
          "stale_goal"
        );
      }
    }

    if (isChecklist && !goal.milestones.length) {
      addSuggestion(
        "Add milestones so the checklist has visible checkpoints.",
        "Checklist goals need milestones to create progress.",
        "medium",
        "missing_milestones"
      );
    }

    const nextIncompleteMilestone = isChecklist
      ? goal.milestones.find((milestone) => milestone.status !== "COMPLETED")
      : null;

    if (nextIncompleteMilestone) {
      addSuggestion(
        `Move the next milestone: ${nextIncompleteMilestone.title}.`,
        "This is the next incomplete milestone on the checklist.",
        "low",
        "checklist_next_milestone"
      );
    }

    if (
      numericGoalTypes.has(goal.goalType) &&
      hasTargetValue &&
      missingCurrentValue
    ) {
      if (goal.goalType === "DEBT") {
        addSuggestion(
          "Confirm exact balances and monthly payments.",
          "Debt goals need the real balance picture before payoff choices are useful.",
          "medium",
          "missing_progress"
        );
      } else if (goal.goalType === "MONEY") {
        addSuggestion(
          "Set the current saved amount.",
          "Money goals need the starting amount before progress can be trusted.",
          "medium",
          "missing_progress"
        );
      } else {
        addSuggestion(
          "Enter the current progress value.",
          "This numeric goal has a target but no current value yet.",
          "medium",
          "missing_progress"
        );
      }
    }

    if (goal.goalType === "DEBT") {
      if (missingCurrentValue && !hasTargetValue) {
        addSuggestion(
          "Confirm exact balances and monthly payments.",
          "Debt goals need the real balance picture before payoff choices are useful.",
          "medium",
          "missing_progress"
        );
      }

      if (!hasNextAction) {
        addSuggestion(
          "Choose a payoff order for the debts.",
          "A debt goal should make the next payoff target obvious.",
          "medium",
          "missing_next_action"
        );
      }
    }

    if (goal.goalType === "MONEY") {
      if (missingCurrentValue && !hasTargetValue) {
        addSuggestion(
          "Set the current saved amount.",
          "Money goals need the starting amount before progress can be trusted.",
          "medium",
          "missing_progress"
        );
      }

      if (!hasNextAction) {
        addSuggestion(
          "Choose the monthly contribution.",
          "A money goal moves better when the recurring contribution is explicit.",
          "medium",
          "missing_next_action"
        );
      }
    }

    if (normalizedPillarName === "home / land" || normalizedPillarName === "home/land") {
      if (!hasActiveLocationDecision(goal)) {
        addSuggestion(
          "Choose target areas for the land search and log that location decision.",
          "Home / Land goals need an active location decision before parcel research can narrow.",
          "medium",
          "missing_location_decision"
        );
      }

      if (!hasNextAction) {
        addSuggestion(
          "Define target counties for the search.",
          "Home and land goals need a clear search area before research can narrow.",
          "medium",
          "missing_next_action"
        );
      }

      if (!goal.milestones.length) {
        addSuggestion(
          "Set max land price, then add checks for zoning, flood zone, HOA, and restrictions.",
          "Land decisions need price and restriction checkpoints before comparing parcels.",
          "medium",
          "missing_milestones"
        );
      }
    }

    if (normalizedPillarName === "career" && !hasNextAction) {
      addSuggestion(
        "Update the resume, then pick the next application or interview action.",
        "Career goals should point to a concrete outward-facing move.",
        "medium",
        "missing_next_action"
      );
    }

    if (normalizedPillarName === "business" && !hasNextAction) {
      addSuggestion(
        "Pick one customer-facing improvement.",
        "Business goals create momentum fastest when the next move touches the customer experience.",
        "medium",
        "missing_next_action"
      );
    }

    if (normalizedPillarName === "family" && !hasNextAction) {
      addSuggestion(
        "Choose one routine to improve.",
        "Family goals work best when the next move is a specific repeatable routine.",
        "medium",
        "missing_next_action"
      );
    }

    if (normalizedPillarName === "relationship" && !hasNextAction) {
      addSuggestion(
        "Schedule the next weekly check-in.",
        "Relationship goals need a protected conversation rhythm.",
        "medium",
        "missing_next_action"
      );
    }
  }

  return suggestions.sort(sortNextStepSuggestions);
}

export function getTopNextStepForGoal(goal: NextStepGoal, now = new Date()) {
  return getNextStepSuggestions([goal], now)[0] ?? null;
}

function normalizeReviewText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function excerpt(value: string, maxLength = 150) {
  const text = normalizeReviewText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function tokenize(value: string) {
  return normalizeReviewText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s/]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function goalSearchText(goal: NextStepGoal) {
  return [
    goal.title,
    goal.description,
    goal.pillar.name,
    goal.nextAction,
    goal.blocker,
    goal.goalType,
    ...goal.milestones.flatMap((milestone) => [milestone.title, milestone.description]),
    ...(goal.decisionLogs ?? []).flatMap((decisionLog) => [
      decisionLog.title,
      decisionLog.decision,
      decisionLog.reason,
      decisionLog.category,
      decisionLog.status
    ])
  ]
    .filter(Boolean)
    .join(" ");
}

function scoreGoalForReviewText(goal: NextStepGoal, reviewText: string) {
  const reviewTokens = tokenize(reviewText);
  const goalTokens = new Set(tokenize(goalSearchText(goal)));

  if (!reviewTokens.length || !goalTokens.size) {
    return 0;
  }

  return reviewTokens.reduce((score, token) => score + (goalTokens.has(token) ? 1 : 0), 0);
}

function pickReviewGoal(goals: NextStepGoal[], reviewText: string, preferStuck = false) {
  const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");

  if (!activeGoals.length) {
    return null;
  }

  return [...activeGoals].sort((a, b) => {
    const scoreDelta =
      scoreGoalForReviewText(b, reviewText) - scoreGoalForReviewText(a, reviewText);
    const stuckDelta =
      Number(Boolean(b.blocker?.trim()) || !b.nextAction?.trim()) -
      Number(Boolean(a.blocker?.trim()) || !a.nextAction?.trim());

    const aUpdatedAt = toDate(a.updatedAt)?.getTime() ?? 0;
    const bUpdatedAt = toDate(b.updatedAt)?.getTime() ?? 0;

    return scoreDelta || (preferStuck ? stuckDelta : 0) || aUpdatedAt - bUpdatedAt;
  })[0];
}

function reviewReason(label: string, review: WeeklyReviewLike, text: string) {
  const reviewDate = toDate(review.weekStartDate);
  const dateLabel = reviewDate
    ? reviewDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "latest review";

  return `${label} from the ${dateLabel} weekly review: ${excerpt(text, 120)}`;
}

export function getWeeklyReviewNextStepSuggestions({
  review,
  goals
}: {
  review: WeeklyReviewLike | null | undefined;
  goals: NextStepGoal[];
}): NextStepSuggestion[] {
  if (!review) {
    return [];
  }

  const suggestions: NextStepSuggestion[] = [];
  const used = new Set<string>();

  const addReviewSuggestion = ({
    text,
    category,
    priority,
    suggestion,
    reasonLabel,
    preferStuck = false
  }: {
    text: string;
    category: NextStepCategory;
    priority: NextStepPriority;
    suggestion: string;
    reasonLabel: string;
    preferStuck?: boolean;
  }) => {
    const normalizedText = normalizeReviewText(text);

    if (!normalizedText) {
      return;
    }

    const goal = pickReviewGoal(goals, normalizedText, preferStuck);

    if (!goal) {
      return;
    }

    const key = `${goal.id}-${category}`;
    if (used.has(key)) {
      return;
    }

    used.add(key);
    suggestions.push({
      goalId: goal.id,
      goalTitle: goal.title,
      pillarName: goal.pillar.name,
      suggestion,
      reason: reviewReason(reasonLabel, review, normalizedText),
      priority,
      category
    });
  };

  addReviewSuggestion({
    text: review.stuckPoints,
    category: "blocked_goal",
    priority: "high",
    suggestion: `Turn this weekly stuck point into an unblock action: ${excerpt(
      review.stuckPoints
    )}`,
    reasonLabel: "Stuck point",
    preferStuck: true
  });

  addReviewSuggestion({
    text: review.focusNextWeek,
    category: "weekly_review_focus",
    priority: "medium",
    suggestion: `Make this weekly focus concrete: ${excerpt(review.focusNextWeek)}`,
    reasonLabel: "Focus",
    preferStuck: false
  });

  addReviewSuggestion({
    text: review.cutOrPause,
    category: "weekly_review_cut_or_pause",
    priority: "medium",
    suggestion: `Decide what to cut or pause this week: ${excerpt(review.cutOrPause)}`,
    reasonLabel: "Cut or pause",
    preferStuck: true
  });

  return suggestions.sort(sortNextStepSuggestions);
}
