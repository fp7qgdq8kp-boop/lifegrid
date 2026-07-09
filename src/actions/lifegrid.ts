"use server";

import { GoalStatus, GoalType, MilestoneStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/lib/action-state";
import { getViewerContext } from "@/lib/auth";
import {
  decisionLogCategoryValues,
  decisionLogStatusValues
} from "@/lib/constants";
import { parseMilestoneLinksText } from "@/lib/milestones";
import { nextStepCategories } from "@/lib/next-steps";
import { createActivityEventWithNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { calculateGoalProgress } from "@/lib/progress";
import { emptyToNull, toNumberOrNull } from "@/lib/utils";

const goalSchema = z.object({
  goalId: z.string().optional(),
  pillarId: z.string().min(1, "Choose a pillar."),
  title: z.string().trim().min(2, "Goal title is required."),
  description: z.string().optional(),
  goalType: z.nativeEnum(GoalType),
  targetValue: z.string().optional(),
  currentValue: z.string().optional(),
  unit: z.string().optional(),
  status: z.nativeEnum(GoalStatus),
  deadline: z.string().optional(),
  nextAction: z.string().optional(),
  blocker: z.string().optional(),
  isShared: z.enum(["true", "false"]).default("true")
});

const createGoalSchema = goalSchema.extend({
  nextAction: z.string().trim().min(2, "Add the next concrete action.")
});

const updateGoalSchema = goalSchema.extend({
  goalId: z.string().min(1, "Goal id is required.")
});

const progressSchema = z.object({
  goalId: z.string().min(1),
  newValue: z.string().optional(),
  note: z.string().optional(),
  nextAction: z.string().optional(),
  blocker: z.string().optional()
});

const decisionLogSchema = z.object({
  goalId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(2, "Decision title is required.")
    .max(120, "Keep the title under 120 characters."),
  category: z.enum(decisionLogCategoryValues),
  status: z.enum(decisionLogStatusValues),
  decision: z
    .string()
    .trim()
    .min(2, "Capture the decision or note.")
    .max(2000, "Keep the decision under 2,000 characters."),
  reason: z
    .string()
    .trim()
    .min(2, "Capture why this decision was made.")
    .max(2000, "Keep the reason under 2,000 characters."),
  reviewDate: z.string().optional()
});

const updateDecisionLogSchema = decisionLogSchema.extend({
  decisionLogId: z.string().min(1, "Decision log id is required.")
});

const applySuggestedNextMoveSchema = z.object({
  goalId: z.string().min(1),
  suggestion: z.string().trim().min(2).max(500),
  category: z.enum(nextStepCategories)
});

const editSuggestedNextMoveSchema = z.object({
  goalId: z.string().min(1),
  nextAction: z
    .string()
    .trim()
    .min(2, "Add the next concrete action.")
    .max(500, "Keep the next action under 500 characters."),
  blocker: z.string().optional(),
  category: z.enum(nextStepCategories)
});

const milestoneSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().trim().min(2, "Milestone title is required."),
  description: z.string().optional()
});

const updateMilestoneSchema = z.object({
  milestoneId: z.string().min(1, "Milestone id is required."),
  title: z
    .string()
    .trim()
    .min(2, "Milestone title is required.")
    .max(140, "Keep the title under 140 characters."),
  description: z.string().optional(),
  status: z.nativeEnum(MilestoneStatus),
  decisionSummary: z
    .string()
    .optional()
    .transform((value) => value?.trim()),
  notes: z.string().optional(),
  linksText: z.string().optional()
});

const weeklyReviewSchema = z.object({
  weekStartDate: z.string().min(1, "Week start is required."),
  wins: z.string().trim().min(2, "Capture at least one win."),
  stuckPoints: z.string().trim().min(2, "Call out what got stuck."),
  focusNextWeek: z.string().trim().min(2, "Add a focus for next week."),
  cutOrPause: z.string().trim().min(2, "Add something to cut or pause."),
  notes: z.string().optional()
});

function getFieldErrors(error: z.ZodError): Record<string, string[] | undefined> {
  return error.flatten().fieldErrors;
}

async function logActivity(input: {
  householdId: string;
  userId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  message: string;
  notification?: Parameters<typeof createActivityEventWithNotifications>[0]["notification"];
}) {
  const { notification, ...activity } = input;

  await prisma.$transaction(async (tx) => {
    await createActivityEventWithNotifications({
      tx,
      activity,
      notification
    });
  });
}

function revalidateLifeGrid(goalId?: string) {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/pillars");
  revalidatePath("/weekly-review");
  revalidatePath("/activity");
  revalidatePath("/notifications");

  if (goalId) {
    revalidatePath(`/goals/${goalId}`);
  }
}

function revalidateNotifications() {
  revalidatePath("/notifications");
}

function toOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseMilestoneCustomFields(formData: FormData) {
  const customFields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("customFields.") || typeof value !== "string") {
      continue;
    }

    const fieldKey = key.slice("customFields.".length).trim();
    const fieldValue = value.trim();

    if (!fieldKey || !/^[A-Za-z0-9_-]+$/.test(fieldKey) || !fieldValue) {
      continue;
    }

    customFields[fieldKey] = fieldValue;
  }

  return customFields;
}

function humanizeStatus(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function changedGoalFields(existingGoal: {
  title: string;
  description: string | null;
  status: GoalStatus;
  deadline: Date | null;
  nextAction: string | null;
  blocker: string | null;
}, payload: z.infer<typeof updateGoalSchema>) {
  const changes: Record<string, { oldValue: string | null; newValue: string | null }> = {};
  const normalizedDescription = emptyToNull(payload.description);
  const normalizedNextAction = emptyToNull(payload.nextAction);
  const normalizedBlocker = emptyToNull(payload.blocker);
  const normalizedDeadline = payload.deadline ? new Date(payload.deadline) : null;

  if (existingGoal.title !== payload.title) {
    changes.title = { oldValue: existingGoal.title, newValue: payload.title };
  }

  if ((existingGoal.description ?? null) !== normalizedDescription) {
    changes.description = {
      oldValue: existingGoal.description,
      newValue: normalizedDescription
    };
  }

  if (existingGoal.status !== payload.status) {
    changes.status = {
      oldValue: existingGoal.status,
      newValue: payload.status
    };
  }

  if ((existingGoal.nextAction ?? null) !== normalizedNextAction) {
    changes.nextAction = {
      oldValue: existingGoal.nextAction,
      newValue: normalizedNextAction
    };
  }

  if ((existingGoal.blocker ?? null) !== normalizedBlocker) {
    changes.blocker = {
      oldValue: existingGoal.blocker,
      newValue: normalizedBlocker
    };
  }

  if ((existingGoal.deadline?.toISOString() ?? null) !== (normalizedDeadline?.toISOString() ?? null)) {
    changes.deadline = {
      oldValue: existingGoal.deadline?.toISOString() ?? null,
      newValue: normalizedDeadline?.toISOString() ?? null
    };
  }

  return changes;
}

function crossedProgressThreshold(previousProgress: number, nextProgress: number) {
  return [25, 50, 75, 100].find(
    (threshold) => previousProgress < threshold && nextProgress >= threshold
  );
}

type CompletableMilestone = {
  id: string;
  title: string;
  status: MilestoneStatus;
  completedAt: Date | null;
  goal: {
    id: string;
    title: string;
    goalType: GoalType;
    isShared: boolean;
    milestones: Array<{
      id: string;
      status: MilestoneStatus;
    }>;
  };
};

async function completeMilestoneInTransaction({
  tx,
  milestone,
  householdId,
  userId,
  completedAt
}: {
  tx: Prisma.TransactionClient;
  milestone: CompletableMilestone;
  householdId: string;
  userId: string;
  completedAt: Date;
}) {
  await tx.milestone.update({
    where: { id: milestone.id },
    data: {
      status: MilestoneStatus.COMPLETED,
      completedAt
    }
  });

  const remaining = milestone.goal.milestones.filter(
    (item) => item.id !== milestone.id && item.status !== MilestoneStatus.COMPLETED
  );

  const nextActive = remaining.find((item) => item.status === MilestoneStatus.ACTIVE);
  const nextPending = remaining.find((item) => item.status === MilestoneStatus.PENDING);

  if (!nextActive && nextPending) {
    await tx.milestone.update({
      where: { id: nextPending.id },
      data: {
        status: MilestoneStatus.ACTIVE
      }
    });
  }

  const goalCompleted = remaining.length === 0;

  if (goalCompleted && milestone.goal.goalType === GoalType.CHECKLIST) {
    await tx.goal.update({
      where: { id: milestone.goal.id },
      data: {
        status: GoalStatus.COMPLETED,
        completedAt
      }
    });
  }

  await createActivityEventWithNotifications({
    tx,
    activity: {
      householdId,
      userId,
      eventType: "milestone.completed",
      entityType: "milestone",
      entityId: milestone.id,
      message: `${milestone.title} was completed for ${milestone.goal.title}.`
    },
    notification: {
      type: goalCompleted ? "plan_status_changed" : "milestone_completed",
      title: goalCompleted ? "Goal completed" : "Milestone completed",
      message: goalCompleted
        ? `${milestone.goal.title} is complete.`
        : `${milestone.title} was completed for ${milestone.goal.title}.`,
      goalId: milestone.goal.id,
      milestoneId: milestone.id,
      includeActor: true,
      recipientUserIds: milestone.goal.isShared ? undefined : [userId],
      metadata: {
        milestoneTitle: milestone.title,
        goalTitle: milestone.goal.title,
        goalCompleted
      }
    }
  });
}

export async function createGoalAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = createGoalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted goal fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;
  const pillar = await prisma.pillar.findFirst({
    where: {
      id: payload.pillarId,
      householdId: household.id
    }
  });

  if (!pillar) {
    return {
      status: "error",
      message: "That pillar could not be found."
    };
  }

  const goal = await prisma.goal.create({
    data: {
      householdId: household.id,
      ownerUserId: user.id,
      pillarId: pillar.id,
      title: payload.title,
      description: emptyToNull(payload.description),
      goalType: payload.goalType,
      targetValue: toNumberOrNull(payload.targetValue),
      currentValue: toNumberOrNull(payload.currentValue),
      unit: emptyToNull(payload.unit),
      status: payload.status,
      deadline: payload.deadline ? new Date(payload.deadline) : null,
      nextAction: emptyToNull(payload.nextAction),
      blocker: emptyToNull(payload.blocker),
      isShared: payload.isShared === "true",
      completedAt: payload.status === GoalStatus.COMPLETED ? new Date() : null
    }
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "goal.created",
    entityType: "goal",
    entityId: goal.id,
    message: `${goal.title} was added under ${pillar.name}.`,
    notification: goal.isShared
      ? {
          type: "partner_activity",
          title: "Plan added",
          message: `${user.name} added ${goal.title} under ${pillar.name}.`,
          goalId: goal.id,
          pillarId: pillar.id,
          metadata: {
            goalTitle: goal.title,
            pillarName: pillar.name,
            status: goal.status
          }
        }
      : undefined
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: "Goal created."
  };
}

export async function updateGoalAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = updateGoalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted goal fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const existingGoal = await prisma.goal.findFirst({
    where: {
      id: payload.goalId,
      householdId: household.id
    }
  });

  if (!existingGoal) {
    return {
      status: "error",
      message: "That goal could not be found."
    };
  }

  const pillar = await prisma.pillar.findFirst({
    where: {
      id: payload.pillarId,
      householdId: household.id
    }
  });

  if (!pillar) {
    return {
      status: "error",
      message: "That pillar could not be found."
    };
  }

  const changes = changedGoalFields(existingGoal, payload);
  const changedFieldNames = Object.keys(changes);
  const statusChanged = Boolean(changes.status);

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id: existingGoal.id },
      data: {
        pillarId: pillar.id,
        title: payload.title,
        description: emptyToNull(payload.description),
        goalType: payload.goalType,
        targetValue: toNumberOrNull(payload.targetValue),
        currentValue: toNumberOrNull(payload.currentValue),
        unit: emptyToNull(payload.unit),
        status: payload.status,
        deadline: payload.deadline ? new Date(payload.deadline) : null,
        nextAction: emptyToNull(payload.nextAction),
        blocker: emptyToNull(payload.blocker),
        isShared: payload.isShared === "true",
        completedAt:
          payload.status === GoalStatus.COMPLETED
            ? existingGoal.completedAt ?? new Date()
            : null
      }
    });

    await createActivityEventWithNotifications({
      tx,
      activity: {
        householdId: household.id,
        userId: user.id,
        eventType: "goal.updated",
        entityType: "goal",
        entityId: existingGoal.id,
        message: `${payload.title} was updated.`
      },
      notification: changedFieldNames.length
        ? payload.isShared === "true" || payload.status === GoalStatus.COMPLETED
          ? {
            type: statusChanged ? "plan_status_changed" : "partner_activity",
            title: statusChanged ? "Plan status changed" : "Plan updated",
            message: statusChanged
              ? `${user.name} moved ${payload.title} from ${humanizeStatus(
                  existingGoal.status
                )} to ${humanizeStatus(payload.status)}.`
              : `${user.name} updated ${payload.title}.`,
            goalId: existingGoal.id,
            pillarId: pillar.id,
            includeActor: payload.status === GoalStatus.COMPLETED,
            recipientUserIds: payload.isShared === "true" ? undefined : [user.id],
            metadata: {
              changedFields: changedFieldNames,
              changes
            }
          }
          : undefined
        : undefined
    });
  });

  revalidateLifeGrid(existingGoal.id);

  return {
    status: "success",
    message: "Goal updated."
  };
}

export async function createDecisionLogAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = decisionLogSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted decision fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const goal = await prisma.goal.findFirst({
    where: {
      id: payload.goalId,
      householdId: household.id
    }
  });

  if (!goal) {
    return {
      status: "error",
      message: "That goal could not be found."
    };
  }

  const decisionLog = await prisma.$transaction(async (tx) => {
    const created = await tx.decisionLog.create({
      data: {
        householdId: household.id,
        goalId: goal.id,
        userId: user.id,
        title: payload.title,
        category: payload.category,
        status: payload.status,
        decision: payload.decision,
        reason: payload.reason,
        reviewDate: toOptionalDate(payload.reviewDate)
      }
    });

    await createActivityEventWithNotifications({
      tx,
      activity: {
        householdId: household.id,
        userId: user.id,
        eventType: "decision-log.created",
        entityType: "decision-log",
        entityId: created.id,
        message: `Decision logged for ${goal.title}: ${created.title}.`
      },
      notification: goal.isShared
        ? {
        type: "decision_created",
        title: "Decision added",
        message: `${user.name} added a new decision to ${goal.title}.`,
        goalId: goal.id,
        decisionLogId: created.id,
        metadata: {
          decisionTitle: created.title,
          goalTitle: goal.title,
          category: created.category,
          status: created.status
        }
      }
        : undefined
    });

    return created;
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: `Decision logged: ${decisionLog.title}.`
  };
}

export async function updateDecisionLogAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = updateDecisionLogSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted decision fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const existingDecisionLog = await prisma.decisionLog.findFirst({
    where: {
      id: payload.decisionLogId,
      goalId: payload.goalId,
      householdId: household.id
    },
    include: {
      goal: true
    }
  });

  if (!existingDecisionLog) {
    return {
      status: "error",
      message: "That decision log could not be found."
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.decisionLog.update({
      where: { id: existingDecisionLog.id },
      data: {
        title: payload.title,
        category: payload.category,
        status: payload.status,
        decision: payload.decision,
        reason: payload.reason,
        reviewDate: toOptionalDate(payload.reviewDate)
      }
    });

    await createActivityEventWithNotifications({
      tx,
      activity: {
        householdId: household.id,
        userId: user.id,
        eventType: "decision-log.updated",
        entityType: "decision-log",
        entityId: existingDecisionLog.id,
        message: `Decision updated for ${existingDecisionLog.goal.title}: ${payload.title}.`
      },
      notification: existingDecisionLog.goal.isShared
        ? {
        type: "decision_updated",
        title: "Decision updated",
        message: `${user.name} updated a decision in ${existingDecisionLog.goal.title}.`,
        goalId: existingDecisionLog.goal.id,
        decisionLogId: existingDecisionLog.id,
        metadata: {
          decisionTitle: payload.title,
          previousTitle: existingDecisionLog.title,
          goalTitle: existingDecisionLog.goal.title,
          category: payload.category,
          status: payload.status
        }
      }
        : undefined
    });
  });

  revalidateLifeGrid(existingDecisionLog.goal.id);

  return {
    status: "success",
    message: "Decision updated."
  };
}

export async function archiveDecisionLogAction(formData: FormData) {
  const decisionLogId = formData.get("decisionLogId");

  if (typeof decisionLogId !== "string" || !decisionLogId) {
    return;
  }

  const { household, user } = await getViewerContext();
  const decisionLog = await prisma.decisionLog.findFirst({
    where: {
      id: decisionLogId,
      householdId: household.id
    },
    include: {
      goal: true
    }
  });

  if (!decisionLog) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.decisionLog.update({
      where: { id: decisionLog.id },
      data: {
        status: "archived"
      }
    });

    await createActivityEventWithNotifications({
      tx,
      activity: {
        householdId: household.id,
        userId: user.id,
        eventType: "decision-log.archived",
        entityType: "decision-log",
        entityId: decisionLog.id,
        message: `Decision archived for ${decisionLog.goal.title}: ${decisionLog.title}.`
      },
      notification: decisionLog.goal.isShared
        ? {
        type: "decision_updated",
        title: "Decision archived",
        message: `${user.name} archived a decision in ${decisionLog.goal.title}.`,
        goalId: decisionLog.goal.id,
        decisionLogId: decisionLog.id,
        metadata: {
          decisionTitle: decisionLog.title,
          goalTitle: decisionLog.goal.title,
          status: "archived"
        }
      }
        : undefined
    });
  });

  revalidateLifeGrid(decisionLog.goal.id);
}

export async function applySuggestedNextMoveAction(formData: FormData) {
  const parsed = applySuggestedNextMoveSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return;
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const goal = await prisma.goal.findFirst({
    where: {
      id: payload.goalId,
      householdId: household.id
    }
  });

  if (!goal) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id: goal.id },
      data: {
        nextAction: payload.suggestion,
        blocker: payload.category === "blocked_goal" ? goal.blocker : null
      }
    });

    await tx.activityEvent.create({
      data: {
        householdId: household.id,
        userId: user.id,
        eventType: "next-step.applied",
        entityType: "goal",
        entityId: goal.id,
        message: `Recommended next move was applied to ${goal.title}: ${payload.suggestion}`
      }
    });
  });

  revalidateLifeGrid(goal.id);
}

export async function editAndApplySuggestedNextMoveAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = editSuggestedNextMoveSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the edited next move.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const goal = await prisma.goal.findFirst({
    where: {
      id: payload.goalId,
      householdId: household.id
    }
  });

  if (!goal) {
    return {
      status: "error",
      message: "That goal could not be found."
    };
  }

  const editedBlocker = emptyToNull(payload.blocker);

  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: { id: goal.id },
      data: {
        nextAction: payload.nextAction,
        blocker:
          editedBlocker ??
          (payload.category === "blocked_goal" ? goal.blocker : null)
      }
    });

    await tx.activityEvent.create({
      data: {
        householdId: household.id,
        userId: user.id,
        eventType: "next-step.edited-applied",
        entityType: "goal",
        entityId: goal.id,
        message: `Edited recommended next move was applied to ${goal.title}: ${payload.nextAction}`
      }
    });
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: "Next move applied."
  };
}

export async function updateGoalProgressAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = progressSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the update fields and try again.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const goal = await prisma.goal.findFirst({
    where: {
      id: payload.goalId,
      householdId: household.id
    },
    include: {
      pillar: true,
      milestones: {
        select: {
          status: true
        }
      }
    }
  });

  if (!goal) {
    return {
      status: "error",
      message: "That goal could not be found."
    };
  }

  const requiresNumericValue =
    goal.goalType !== GoalType.CHECKLIST && goal.goalType !== GoalType.RECURRING;
  const parsedNewValue = toNumberOrNull(payload.newValue);

  if (requiresNumericValue && parsedNewValue === null) {
    return {
      status: "error",
      message: "Add a new current value before saving progress.",
      fieldErrors: {
        newValue: ["Add a new current value."]
      }
    };
  }

  const newValue = requiresNumericValue ? parsedNewValue : goal.currentValue;
  const previousProgress = calculateGoalProgress(goal);
  const nextProgress = calculateGoalProgress({
    ...goal,
    currentValue: newValue
  });
  const reachedThreshold = crossedProgressThreshold(previousProgress, nextProgress);

  await prisma.$transaction(async (tx) => {
    const progressLog = await tx.progressLog.create({
      data: {
        goalId: goal.id,
        userId: user.id,
        previousValue: goal.currentValue,
        newValue,
        note: emptyToNull(payload.note)
      }
    });

    await tx.goal.update({
      where: { id: goal.id },
      data: {
        currentValue: newValue,
        nextAction: emptyToNull(payload.nextAction),
        blocker: emptyToNull(payload.blocker)
      }
    });

    await createActivityEventWithNotifications({
      tx,
      activity: {
        householdId: household.id,
        userId: user.id,
        eventType: "goal.progress-updated",
        entityType: "goal",
        entityId: goal.id,
        message:
          goal.goalType === GoalType.CHECKLIST
            ? `${goal.title} received a progress note.`
            : `${goal.title} moved from ${goal.currentValue ?? 0} to ${newValue ?? 0}.`
      },
      notification: reachedThreshold
        ? {
            type: "progress_threshold_reached",
            title: "Progress milestone reached",
            message: `${goal.title} reached ${reachedThreshold}% progress.`,
            goalId: goal.id,
            pillarId: goal.pillarId,
            progressLogId: progressLog.id,
            includeActor: true,
            recipientUserIds: goal.isShared ? undefined : [user.id],
            metadata: {
              previousProgress,
              nextProgress,
              reachedThreshold,
              previousValue: goal.currentValue,
              newValue
            }
          }
        : goal.isShared
          ? {
            type: "progress_log_added",
            title: "Progress updated",
            message: `${user.name} updated progress on ${goal.title}.`,
            goalId: goal.id,
            pillarId: goal.pillarId,
            progressLogId: progressLog.id,
            metadata: {
              previousValue: goal.currentValue,
              newValue,
              previousProgress,
              nextProgress
            }
          }
          : undefined
    });
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: "Progress updated."
  };
}

export async function createMilestoneAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the milestone fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;

  const goal = await prisma.goal.findFirst({
    where: {
      id: payload.goalId,
      householdId: household.id
    },
    include: {
      milestones: {
        orderBy: {
          sortOrder: "desc"
        },
        take: 1
      }
    }
  });

  if (!goal) {
    return {
      status: "error",
      message: "That goal could not be found."
    };
  }

  const milestone = await prisma.milestone.create({
    data: {
      goalId: goal.id,
      title: payload.title,
      description: emptyToNull(payload.description),
      links: [],
      customFields: {},
      sortOrder: (goal.milestones[0]?.sortOrder ?? -1) + 1,
      status: goal.milestones.length ? MilestoneStatus.PENDING : MilestoneStatus.ACTIVE
    }
  });

  if (goal.status === GoalStatus.COMPLETED) {
    await prisma.goal.update({
      where: { id: goal.id },
      data: {
        status: GoalStatus.ACTIVE,
        completedAt: null
      }
    });
  }

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "milestone.created",
    entityType: "milestone",
    entityId: milestone.id,
    message: `A milestone was added to ${goal.title}: ${milestone.title}.`,
    notification: goal.isShared
      ? {
      type: "partner_activity",
      title: "Milestone added",
      message: `${user.name} added a milestone to ${goal.title}.`,
      goalId: goal.id,
      milestoneId: milestone.id,
      metadata: {
        goalTitle: goal.title,
        milestoneTitle: milestone.title
      }
    }
      : undefined
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: "Milestone added."
  };
}

export async function updateMilestoneAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = updateMilestoneSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the milestone details.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;
  const customFields = parseMilestoneCustomFields(formData);
  const links = parseMilestoneLinksText(payload.linksText);

  const milestone = await prisma.milestone.findFirst({
    where: { id: payload.milestoneId },
    include: {
      goal: {
        include: {
          milestones: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      }
    }
  });

  if (!milestone || milestone.goal.householdId !== household.id) {
    return {
      status: "error",
      message: "That milestone could not be found."
    };
  }

  const completedAt =
    payload.status === MilestoneStatus.COMPLETED
      ? milestone.completedAt ?? new Date()
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.milestone.update({
      where: { id: milestone.id },
      data: {
        title: payload.title,
        description: emptyToNull(payload.description),
        decisionSummary: emptyToNull(payload.decisionSummary),
        notes: emptyToNull(payload.notes),
        links: links as Prisma.InputJsonValue,
        customFields: customFields as Prisma.InputJsonValue,
        status: payload.status,
        completedAt
      }
    });

    if (
      payload.status === MilestoneStatus.COMPLETED &&
      milestone.status !== MilestoneStatus.COMPLETED &&
      completedAt
    ) {
      await completeMilestoneInTransaction({
        tx,
        milestone: {
          ...milestone,
          title: payload.title
        },
        householdId: household.id,
        userId: user.id,
        completedAt
      });
      return;
    }

    if (
      payload.status !== MilestoneStatus.COMPLETED &&
      milestone.status === MilestoneStatus.COMPLETED &&
      milestone.goal.goalType === GoalType.CHECKLIST
    ) {
      await tx.goal.update({
        where: { id: milestone.goal.id },
        data: {
          status: GoalStatus.ACTIVE,
          completedAt: null
        }
      });
    }

    await createActivityEventWithNotifications({
      tx,
      activity: {
        householdId: household.id,
        userId: user.id,
        eventType: "milestone.updated",
        entityType: "milestone",
        entityId: milestone.id,
        message: `${payload.title} details were updated for ${milestone.goal.title}.`
      },
      notification: milestone.goal.isShared
        ? {
        type: "partner_activity",
        title: "Milestone updated",
        message: `${user.name} updated a milestone in ${milestone.goal.title}.`,
        goalId: milestone.goal.id,
        milestoneId: milestone.id,
        metadata: {
          goalTitle: milestone.goal.title,
          milestoneTitle: payload.title,
          status: payload.status
        }
      }
        : undefined
    });
  });

  revalidateLifeGrid(milestone.goal.id);

  return {
    status: "success",
    message: "Milestone details saved."
  };
}

export async function completeMilestoneAction(formData: FormData) {
  const milestoneId = formData.get("milestoneId");

  if (typeof milestoneId !== "string" || !milestoneId) {
    return;
  }

  const { household, user } = await getViewerContext();
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId },
    include: {
      goal: {
        include: {
          household: true,
          milestones: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      }
    }
  });

  if (!milestone || milestone.goal.householdId !== household.id) {
    return;
  }

  if (milestone.status === MilestoneStatus.COMPLETED) {
    return;
  }

  const completedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await completeMilestoneInTransaction({
      tx,
      milestone,
      householdId: household.id,
      userId: user.id,
      completedAt
    });
  });

  revalidateLifeGrid(milestone.goal.id);
}

export async function createWeeklyReviewAction(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = weeklyReviewSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the weekly review fields.",
      fieldErrors: getFieldErrors(parsed.error)
    };
  }

  const { household, user } = await getViewerContext();
  const payload = parsed.data;
  const weekStartDate = new Date(payload.weekStartDate);

  const review = await prisma.weeklyReview.upsert({
    where: {
      householdId_weekStartDate: {
        householdId: household.id,
        weekStartDate
      }
    },
    update: {
      wins: payload.wins,
      stuckPoints: payload.stuckPoints,
      focusNextWeek: payload.focusNextWeek,
      cutOrPause: payload.cutOrPause,
      notes: emptyToNull(payload.notes),
      createdByUserId: user.id
    },
    create: {
      householdId: household.id,
      weekStartDate,
      wins: payload.wins,
      stuckPoints: payload.stuckPoints,
      focusNextWeek: payload.focusNextWeek,
      cutOrPause: payload.cutOrPause,
      notes: emptyToNull(payload.notes),
      createdByUserId: user.id
    }
  });

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "weekly-review.created",
    entityType: "weekly-review",
    entityId: review.id,
    message: `Weekly review for ${payload.weekStartDate} was captured.`
  });

  revalidateLifeGrid();

  return {
    status: "success",
    message: "Weekly review saved."
  };
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = formData.get("notificationId");

  if (typeof notificationId !== "string" || !notificationId) {
    return;
  }

  const { household, user } = await getViewerContext();

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      householdId: household.id,
      userId: user.id,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  revalidateNotifications();
}

export async function markAllNotificationsReadAction() {
  const { household, user } = await getViewerContext();

  await prisma.notification.updateMany({
    where: {
      householdId: household.id,
      userId: user.id,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  revalidateNotifications();
}
