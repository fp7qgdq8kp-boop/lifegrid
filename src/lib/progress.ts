type GoalLike = {
  goalType: string;
  targetValue: number | null;
  currentValue: number | null;
  nextAction: string | null;
  blocker: string | null;
  status: string;
  milestones: Array<{ status: string }>;
};

type PillarLike = {
  goals: GoalLike[];
};

export function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function calculateGoalProgress(goal: GoalLike) {
  if (goal.goalType === "CHECKLIST") {
    const totalMilestones = goal.milestones.length;
    if (!totalMilestones) {
      return 0;
    }

    const completedMilestones = goal.milestones.filter(
      (milestone) => milestone.status === "COMPLETED"
    ).length;

    return clampProgress((completedMilestones / totalMilestones) * 100);
  }

  if (!goal.targetValue || goal.targetValue <= 0) {
    return 0;
  }

  return clampProgress(((goal.currentValue ?? 0) / goal.targetValue) * 100);
}

export function calculatePillarProgress(goals: GoalLike[]) {
  const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");

  if (!activeGoals.length) {
    return 0;
  }

  const total = activeGoals.reduce((sum, goal) => sum + calculateGoalProgress(goal), 0);
  return total / activeGoals.length;
}

export function calculateOverallProgress(pillars: PillarLike[]) {
  if (!pillars.length) {
    return 0;
  }

  const total = pillars.reduce((sum, pillar) => sum + calculatePillarProgress(pillar.goals), 0);
  return total / pillars.length;
}

export function hasNextAction(goal: GoalLike) {
  return Boolean(goal.nextAction?.trim());
}

export function isGoalStuck(goal: GoalLike) {
  return goal.status === "ACTIVE" && (!!goal.blocker?.trim() || !hasNextAction(goal));
}

export function completedMilestoneCount(goal: GoalLike) {
  return goal.milestones.filter((milestone) => milestone.status === "COMPLETED").length;
}

