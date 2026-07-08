import { calculateGoalProgress } from "@/lib/progress";

export type NextStepPriority = "low" | "medium" | "high";

export type NextStepCategory =
  | "missing_next_action"
  | "stale_goal"
  | "blocked_goal"
  | "missing_milestones"
  | "deadline_risk"
  | "missing_progress"
  | "checklist_next_milestone"
  | "completion_ready";

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
  milestones: Array<{
    title: string;
    status: string;
  }>;
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
  missing_next_action: 3,
  missing_progress: 4,
  stale_goal: 5,
  missing_milestones: 6,
  checklist_next_milestone: 7
};

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

function isActionable(goal: NextStepGoal) {
  return !nonActionableStatuses.has(goal.status);
}

function sortSuggestions(a: NextStepSuggestion, b: NextStepSuggestion) {
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

  return suggestions.sort(sortSuggestions);
}

export function getTopNextStepForGoal(goal: NextStepGoal, now = new Date()) {
  return getNextStepSuggestions([goal], now)[0] ?? null;
}
