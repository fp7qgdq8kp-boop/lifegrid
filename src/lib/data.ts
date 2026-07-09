import { GoalStatus } from "@prisma/client";

import { getViewerContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getNextStepSuggestions,
  getTopNextStepForGoal,
  getWeeklyReviewNextStepSuggestions,
  type NextStepSuggestion,
  sortNextStepSuggestions
} from "@/lib/next-steps";
import {
  calculateGoalProgress,
  calculateOverallProgress,
  calculatePillarProgress,
  isGoalStuck
} from "@/lib/progress";
import {
  activityEventArgs,
  goalCardArgs,
  pillarWithGoalsArgs,
  weeklyReviewArgs
} from "@/lib/types";

function uniqueNextStepSuggestions(suggestions: NextStepSuggestion[]) {
  const seen = new Set<string>();

  return suggestions.filter((suggestion) => {
    const key = `${suggestion.goalId}-${suggestion.category}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function getDashboardData() {
  const { household, user } = await getViewerContext();

  const [pillars, activity, reviews] = await Promise.all([
    prisma.pillar.findMany({
      where: { householdId: household.id },
      orderBy: { sortOrder: "asc" },
      include: pillarWithGoalsArgs.include
    }),
    prisma.activityEvent.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: activityEventArgs.include
    }),
    prisma.weeklyReview.findMany({
      where: { householdId: household.id },
      orderBy: { weekStartDate: "desc" },
      take: 6,
      include: weeklyReviewArgs.include
    })
  ]);

  const goals = pillars.flatMap((pillar) => pillar.goals);
  const activeGoals = goals.filter((goal) => goal.status === GoalStatus.ACTIVE);
  const pillarSnapshots = pillars.map((pillar) => ({
    ...pillar,
    progress: calculatePillarProgress(pillar.goals)
  }));

  const overallProgress = calculateOverallProgress(pillarSnapshots);
  const stuckGoals = activeGoals.filter(isGoalStuck);
  const goalsMissingNextAction = activeGoals.filter((goal) => !goal.nextAction?.trim());
  const nextActions = activeGoals
    .filter((goal) => goal.nextAction?.trim())
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .slice(0, 6);
  const weeklyReviewNextMoves = getWeeklyReviewNextStepSuggestions({
    review: reviews[0],
    goals: activeGoals
  });
  const suggestedNextMoves = uniqueNextStepSuggestions([
    ...weeklyReviewNextMoves,
    ...getNextStepSuggestions(goals)
  ])
    .sort(sortNextStepSuggestions)
    .slice(0, 8);
  const recentWins = activity.filter(
    (event) =>
      event.eventType.includes("completed") ||
      event.eventType === "weekly-review.created"
  );

  return {
    user,
    household,
    pillars: pillarSnapshots,
    goals,
    activeGoals,
    overallProgress,
    nextActions,
    suggestedNextMoves,
    weeklyReviewNextMoves,
    stuckGoals,
    goalsMissingNextAction,
    reviews,
    activity,
    recentWins
  };
}

export async function getGoalsPageData() {
  const { household } = await getViewerContext();

  const [goals, pillars] = await Promise.all([
    prisma.goal.findMany({
      where: {
        householdId: household.id,
        status: {
          not: GoalStatus.ARCHIVED
        }
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: goalCardArgs.include
    }),
    prisma.pillar.findMany({
      where: { householdId: household.id },
      orderBy: { sortOrder: "asc" },
      include: pillarWithGoalsArgs.include
    })
  ]);

  return {
    goals,
    pillars: pillars.map((pillar) => ({
      ...pillar,
      progress: calculatePillarProgress(pillar.goals)
    }))
  };
}

export async function getGoalDetailData(goalId: string) {
  const { household } = await getViewerContext();

  const [goal, pillars] = await Promise.all([
    prisma.goal.findFirst({
      where: {
        id: goalId,
        householdId: household.id
      },
      include: {
        ...goalCardArgs.include,
        household: true
      }
    }),
    prisma.pillar.findMany({
      where: { householdId: household.id },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  if (!goal) {
    return null;
  }

  const milestoneIds = goal.milestones.map((milestone) => milestone.id);
  const decisionLogIds = goal.decisionLogs.map((decisionLog) => decisionLog.id);
  const activity = await prisma.activityEvent.findMany({
    where: {
      householdId: household.id,
      OR: [
        {
          entityType: "goal",
          entityId: goal.id
        },
        milestoneIds.length
          ? {
              entityType: "milestone",
              entityId: {
                in: milestoneIds
              }
            }
          : {
              entityType: "goal",
              entityId: goal.id
            },
        decisionLogIds.length
          ? {
              entityType: "decision-log",
              entityId: {
                in: decisionLogIds
              }
            }
          : {
              entityType: "goal",
              entityId: goal.id
            }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: activityEventArgs.include
  });

  return {
    goal,
    activity,
    pillars,
    progress: calculateGoalProgress(goal),
    recommendedNextMove: getTopNextStepForGoal(goal)
  };
}

export async function getPillarsPageData() {
  const { household } = await getViewerContext();

  const pillars = await prisma.pillar.findMany({
    where: { householdId: household.id },
    orderBy: { sortOrder: "asc" },
    include: pillarWithGoalsArgs.include
  });

  return pillars.map((pillar) => ({
    ...pillar,
    progress: calculatePillarProgress(pillar.goals)
  }));
}

export async function getWeeklyReviewPageData() {
  const { household } = await getViewerContext();

  const [reviews, activeGoals] = await Promise.all([
    prisma.weeklyReview.findMany({
      where: { householdId: household.id },
      orderBy: { weekStartDate: "desc" },
      include: weeklyReviewArgs.include
    }),
    prisma.goal.findMany({
      where: {
        householdId: household.id,
        status: GoalStatus.ACTIVE
      },
      orderBy: { updatedAt: "desc" },
      include: goalCardArgs.include
    })
  ]);

  const weeklyReviewNextMoves = getWeeklyReviewNextStepSuggestions({
    review: reviews[0],
    goals: activeGoals
  });

  return {
    reviews,
    activeGoals,
    stuckGoals: activeGoals.filter(isGoalStuck),
    weeklyReviewNextMoves
  };
}

export async function getActivityPageData() {
  const { household } = await getViewerContext();

  return prisma.activityEvent.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: activityEventArgs.include
  });
}
