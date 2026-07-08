"use server";

import { GoalStatus, GoalType, MilestoneStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/lib/action-state";
import { getViewerContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

const progressSchema = z.object({
  goalId: z.string().min(1),
  newValue: z.string().optional(),
  note: z.string().optional(),
  nextAction: z.string().optional(),
  blocker: z.string().optional()
});

const milestoneSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().trim().min(2, "Milestone title is required."),
  description: z.string().optional()
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
}) {
  await prisma.activityEvent.create({
    data: input
  });
}

function revalidateLifeGrid(goalId?: string) {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/pillars");
  revalidatePath("/weekly-review");
  revalidatePath("/activity");

  if (goalId) {
    revalidatePath(`/goals/${goalId}`);
  }
}

export async function createGoalAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = goalSchema.safeParse(Object.fromEntries(formData.entries()));

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
    message: `${goal.title} was added under ${pillar.name}.`
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: "Goal created."
  };
}

export async function updateGoalAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = goalSchema.extend({
    goalId: z.string().min(1, "Goal id is required.")
  }).safeParse(Object.fromEntries(formData.entries()));

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

  await prisma.goal.update({
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

  await logActivity({
    householdId: household.id,
    userId: user.id,
    eventType: "goal.updated",
    entityType: "goal",
    entityId: existingGoal.id,
    message: `${payload.title} was updated.`
  });

  revalidateLifeGrid(existingGoal.id);

  return {
    status: "success",
    message: "Goal updated."
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
      pillar: true
    }
  });

  if (!goal) {
    return {
      status: "error",
      message: "That goal could not be found."
    };
  }

  const newValue =
    goal.goalType === GoalType.CHECKLIST
      ? goal.currentValue
      : toNumberOrNull(payload.newValue);

  await prisma.$transaction(async (tx) => {
    if (goal.goalType !== GoalType.CHECKLIST && goal.goalType !== GoalType.RECURRING) {
      await tx.progressLog.create({
        data: {
          goalId: goal.id,
          userId: user.id,
          previousValue: goal.currentValue,
          newValue,
          note: emptyToNull(payload.note)
        }
      });
    }

    await tx.goal.update({
      where: { id: goal.id },
      data: {
        currentValue: newValue,
        nextAction: emptyToNull(payload.nextAction),
        blocker: emptyToNull(payload.blocker)
      }
    });

    await tx.activityEvent.create({
      data: {
        householdId: household.id,
        userId: user.id,
        eventType: "goal.progress-updated",
        entityType: "goal",
        entityId: goal.id,
        message:
          goal.goalType === GoalType.CHECKLIST
            ? `${goal.title} received an update.`
            : `${goal.title} moved from ${goal.currentValue ?? 0} to ${newValue ?? 0}.`
      }
    });
  });

  revalidateLifeGrid(goal.id);

  return {
    status: "success",
    message: "Progress updated."
  };
}

export async function createMilestoneAction(formData: FormData) {
  const parsed = milestoneSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return;
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
    return;
  }

  const milestone = await prisma.milestone.create({
    data: {
      goalId: goal.id,
      title: payload.title,
      description: emptyToNull(payload.description),
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
    message: `A milestone was added to ${goal.title}: ${milestone.title}.`
  });

  revalidateLifeGrid(goal.id);
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

  await prisma.$transaction(async (tx) => {
    await tx.milestone.update({
      where: { id: milestone.id },
      data: {
        status: MilestoneStatus.COMPLETED,
        completedAt: new Date()
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

    if (goalCompleted) {
      await tx.goal.update({
        where: { id: milestone.goal.id },
        data: {
          status: GoalStatus.COMPLETED,
          completedAt: new Date()
        }
      });
    }

    await tx.activityEvent.create({
      data: {
        householdId: household.id,
        userId: user.id,
        eventType: "milestone.completed",
        entityType: "milestone",
        entityId: milestone.id,
        message: `${milestone.title} was completed for ${milestone.goal.title}.`
      }
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
