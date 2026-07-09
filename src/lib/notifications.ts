import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const notificationTypes = [
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

export type NotificationType = (typeof notificationTypes)[number];

type ActivityEventInput = {
  householdId: string;
  userId: string | null;
  goalId?: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  action?: string | null;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  message: string;
  createdAt?: Date;
};

type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  actorUserId?: string | null;
  goalId?: string | null;
  pillarId?: string | null;
  decisionLogId?: string | null;
  milestoneId?: string | null;
  progressLogId?: string | null;
  commentId?: string | null;
  reviewRequestId?: string | null;
  metadata?: Prisma.InputJsonValue;
  targetHref?: string | null;
  includeActor?: boolean;
  recipientUserIds?: string[];
};

function uniqueValues(values: string[]) {
  return [...new Set(values)];
}

function getNotificationTargetHref(notification: NotificationInput) {
  if (notification.targetHref) {
    return notification.targetHref;
  }

  if (notification.goalId && notification.reviewRequestId) {
    return `/goals/${notification.goalId}#review-${notification.reviewRequestId}`;
  }

  if (notification.goalId && notification.commentId) {
    return `/goals/${notification.goalId}#comment-${notification.commentId}`;
  }

  if (notification.goalId && notification.decisionLogId) {
    return `/goals/${notification.goalId}#decision-${notification.decisionLogId}`;
  }

  if (notification.goalId && notification.milestoneId) {
    return `/goals/${notification.goalId}#milestone-${notification.milestoneId}`;
  }

  if (notification.goalId) {
    return `/goals/${notification.goalId}`;
  }

  return "/notifications";
}

async function getNotificationRecipientIds({
  tx,
  householdId,
  actorUserId,
  includeActor,
  recipientUserIds
}: {
  tx: Prisma.TransactionClient;
  householdId: string;
  actorUserId: string | null;
  includeActor: boolean;
  recipientUserIds?: string[];
}) {
  if (recipientUserIds?.length) {
    return uniqueValues(
      recipientUserIds.filter((userId) => includeActor || userId !== actorUserId)
    );
  }

  const members = await tx.householdMember.findMany({
    where: { householdId },
    select: { userId: true }
  });

  return members
    .map((member) => member.userId)
    .filter((userId, index, userIds) => userIds.indexOf(userId) === index)
    .filter((userId) => includeActor || userId !== actorUserId);
}

export async function createActivityEventWithNotifications({
  tx,
  activity,
  notification
}: {
  tx: Prisma.TransactionClient;
  activity: ActivityEventInput;
  notification?: NotificationInput;
}) {
  const activityEvent = await tx.activityEvent.create({
    data: activity
  });

  if (!notification) {
    return activityEvent;
  }

  const actorUserId = notification.actorUserId ?? activity.userId ?? null;
  const recipientIds = await getNotificationRecipientIds({
    tx,
    householdId: activity.householdId,
    actorUserId,
    includeActor: Boolean(notification.includeActor),
    recipientUserIds: notification.recipientUserIds
  });

  if (!recipientIds.length) {
    return activityEvent;
  }

  await tx.notification.createMany({
    data: recipientIds.map((userId) => ({
      householdId: activity.householdId,
      userId,
      actorUserId,
      activityEventId: activityEvent.id,
      goalId: notification.goalId ?? null,
      pillarId: notification.pillarId ?? null,
      decisionLogId: notification.decisionLogId ?? null,
      milestoneId: notification.milestoneId ?? null,
      progressLogId: notification.progressLogId ?? null,
      commentId: notification.commentId ?? null,
      reviewRequestId: notification.reviewRequestId ?? null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata ?? Prisma.JsonNull,
      targetHref: getNotificationTargetHref(notification),
      deliveryStatus: "in_app",
      deliveryChannels: ["in_app"] as Prisma.InputJsonValue
    })),
    skipDuplicates: true
  });

  return activityEvent;
}

export async function ensureDueDecisionReviewNotifications(householdId: string, now = new Date()) {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const dueDecisionLogs = await prisma.decisionLog.findMany({
    where: {
      householdId,
      status: {
        not: "archived"
      },
      reviewDate: {
        lte: endOfToday
      }
    },
    include: {
      goal: true
    },
    orderBy: {
      reviewDate: "asc"
    }
  });

  for (const decisionLog of dueDecisionLogs) {
    const existingEvent = await prisma.activityEvent.findFirst({
      where: {
        householdId,
        eventType: "decision-log.review-due",
        entityType: "decision-log",
        entityId: decisionLog.id
      },
      select: { id: true }
    });

    if (existingEvent) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await createActivityEventWithNotifications({
        tx,
        activity: {
          householdId,
          userId: null,
          goalId: decisionLog.goalId,
          eventType: "decision-log.review-due",
          entityType: "decision-log",
          entityId: decisionLog.id,
          action: "review_due",
          oldValue: {
            reviewDate: decisionLog.reviewDate?.toISOString() ?? null
          },
          metadata: {
            goalTitle: decisionLog.goal.title,
            decisionTitle: decisionLog.title
          },
          message: `A review is due for ${decisionLog.title}.`
        },
        notification: {
          type: "review_reminder_due",
          title: "Decision review due",
          message: `A review is due for ${decisionLog.title} in ${decisionLog.goal.title}.`,
          goalId: decisionLog.goalId,
          decisionLogId: decisionLog.id,
          includeActor: true,
          recipientUserIds: decisionLog.goal.isShared ? undefined : [decisionLog.userId],
          metadata: {
            reviewDate: decisionLog.reviewDate?.toISOString() ?? null,
            goalTitle: decisionLog.goal.title,
            decisionTitle: decisionLog.title
          }
        }
      });
    });
  }
}
