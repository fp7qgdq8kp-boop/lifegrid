import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { GoalStatus, GoalType, HouseholdMemberRole, MilestoneStatus } from "@prisma/client";

import {
  createActivityEventWithNotifications,
  ensureDueDecisionReviewNotifications
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const databaseUrl = process.env.DATABASE_URL;
const integrationTest = databaseUrl ? test : test.skip;

async function createFixture({ isShared = true } = {}) {
  const suffix = randomUUID();
  const [actor, partner] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Actor",
        email: `actor-${suffix}@lifegrid.test`
      }
    }),
    prisma.user.create({
      data: {
        name: "Partner",
        email: `partner-${suffix}@lifegrid.test`
      }
    })
  ]);

  const household = await prisma.household.create({
    data: {
      name: `Notification Test ${suffix}`,
      createdByUserId: actor.id,
      members: {
        create: [
          {
            userId: actor.id,
            role: HouseholdMemberRole.OWNER
          },
          {
            userId: partner.id,
            role: HouseholdMemberRole.MEMBER
          }
        ]
      }
    }
  });

  const pillar = await prisma.pillar.create({
    data: {
      householdId: household.id,
      name: `Plans ${suffix}`,
      sortOrder: 0
    }
  });

  const goal = await prisma.goal.create({
    data: {
      householdId: household.id,
      pillarId: pillar.id,
      ownerUserId: actor.id,
      title: "Shared Test Plan",
      goalType: GoalType.CHECKLIST,
      status: GoalStatus.ACTIVE,
      isShared
    }
  });

  return { actor, partner, household, pillar, goal };
}

async function cleanupFixture(fixture: Awaited<ReturnType<typeof createFixture>>) {
  await prisma.household.delete({
    where: { id: fixture.household.id }
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [fixture.actor.id, fixture.partner.id]
      }
    }
  });
}

integrationTest("partner notifications exclude the actor by default", async () => {
  const fixture = await createFixture();

  try {
    await prisma.$transaction(async (tx) => {
      await createActivityEventWithNotifications({
        tx,
        activity: {
          householdId: fixture.household.id,
          userId: fixture.actor.id,
          eventType: "decision-log.created",
          entityType: "decision-log",
          entityId: fixture.goal.id,
          message: "Actor added a decision."
        },
        notification: {
          type: "decision_created",
          title: "Decision added",
          message: "Actor added a decision to Shared Test Plan.",
          goalId: fixture.goal.id
        }
      });
    });

    const [actorNotifications, partnerNotifications] = await Promise.all([
      prisma.notification.count({
        where: {
          householdId: fixture.household.id,
          userId: fixture.actor.id
        }
      }),
      prisma.notification.findMany({
        where: {
          householdId: fixture.household.id,
          userId: fixture.partner.id
        }
      })
    ]);

    assert.equal(actorNotifications, 0);
    assert.equal(partnerNotifications.length, 1);
    assert.equal(partnerNotifications[0].type, "decision_created");
    assert.equal(partnerNotifications[0].targetHref, `/goals/${fixture.goal.id}`);
  } finally {
    await cleanupFixture(fixture);
  }
});

integrationTest("milestone-style notifications can include the actor", async () => {
  const fixture = await createFixture();

  try {
    const milestone = await prisma.milestone.create({
      data: {
        goalId: fixture.goal.id,
        title: "Finish the thing",
        sortOrder: 0,
        status: MilestoneStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    await prisma.$transaction(async (tx) => {
      await createActivityEventWithNotifications({
        tx,
        activity: {
          householdId: fixture.household.id,
          userId: fixture.actor.id,
          eventType: "milestone.completed",
          entityType: "milestone",
          entityId: milestone.id,
          message: "Milestone completed."
        },
        notification: {
          type: "milestone_completed",
          title: "Milestone completed",
          message: "Finish the thing was completed.",
          goalId: fixture.goal.id,
          milestoneId: milestone.id,
          includeActor: true
        }
      });
    });

    const notifications = await prisma.notification.findMany({
      where: {
        householdId: fixture.household.id,
        type: "milestone_completed"
      },
      orderBy: {
        userId: "asc"
      }
    });

    assert.equal(notifications.length, 2);
    assert.deepEqual(
      notifications.map((notification) => notification.userId).sort(),
      [fixture.actor.id, fixture.partner.id].sort()
    );
    assert.ok(
      notifications.every(
        (notification) =>
          notification.targetHref === `/goals/${fixture.goal.id}#milestone-${milestone.id}`
      )
    );
  } finally {
    await cleanupFixture(fixture);
  }
});

integrationTest("private decision review reminders notify only the decision owner", async () => {
  const fixture = await createFixture({ isShared: false });

  try {
    const decisionLog = await prisma.decisionLog.create({
      data: {
        householdId: fixture.household.id,
        goalId: fixture.goal.id,
        userId: fixture.actor.id,
        title: "Private decision",
        category: "decision",
        status: "active",
        decision: "Keep this private.",
        reason: "It belongs to a private plan.",
        reviewDate: new Date("2026-07-01T00:00:00.000Z")
      }
    });

    await ensureDueDecisionReviewNotifications(
      fixture.household.id,
      new Date("2026-07-09T12:00:00.000Z")
    );

    const notifications = await prisma.notification.findMany({
      where: {
        householdId: fixture.household.id,
        type: "review_reminder_due"
      }
    });

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].userId, fixture.actor.id);
    assert.equal(
      notifications[0].targetHref,
      `/goals/${fixture.goal.id}#decision-${decisionLog.id}`
    );
  } finally {
    await cleanupFixture(fixture);
  }
});

integrationTest("comment notifications link to the comment and skip the actor", async () => {
  const fixture = await createFixture();

  try {
    const comment = await prisma.comment.create({
      data: {
        householdId: fixture.household.id,
        goalId: fixture.goal.id,
        userId: fixture.actor.id,
        body: "Can you review the parcel shortlist?"
      }
    });

    await prisma.$transaction(async (tx) => {
      await createActivityEventWithNotifications({
        tx,
        activity: {
          householdId: fixture.household.id,
          userId: fixture.actor.id,
          eventType: "comment.created",
          entityType: "comment",
          entityId: comment.id,
          message: "Actor commented on Shared Test Plan."
        },
        notification: {
          type: "comment_added",
          title: "New comment",
          message: "Actor commented on Shared Test Plan.",
          goalId: fixture.goal.id,
          commentId: comment.id
        }
      });
    });

    const [actorNotifications, partnerNotification] = await Promise.all([
      prisma.notification.count({
        where: {
          householdId: fixture.household.id,
          userId: fixture.actor.id,
          type: "comment_added"
        }
      }),
      prisma.notification.findFirstOrThrow({
        where: {
          householdId: fixture.household.id,
          userId: fixture.partner.id,
          type: "comment_added"
        }
      })
    ]);

    assert.equal(actorNotifications, 0);
    assert.equal(
      partnerNotification.targetHref,
      `/goals/${fixture.goal.id}#comment-${comment.id}`
    );
  } finally {
    await cleanupFixture(fixture);
  }
});

integrationTest("assigned review requests notify the assigned partner", async () => {
  const fixture = await createFixture();

  try {
    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        householdId: fixture.household.id,
        goalId: fixture.goal.id,
        requestedByUserId: fixture.actor.id,
        assignedToUserId: fixture.partner.id,
        title: "Review the next step"
      }
    });

    await prisma.$transaction(async (tx) => {
      await createActivityEventWithNotifications({
        tx,
        activity: {
          householdId: fixture.household.id,
          userId: fixture.actor.id,
          eventType: "review-request.created",
          entityType: "review-request",
          entityId: reviewRequest.id,
          message: "Actor requested review."
        },
        notification: {
          type: "review_requested",
          title: "Review requested",
          message: "Actor requested review.",
          goalId: fixture.goal.id,
          reviewRequestId: reviewRequest.id,
          recipientUserIds: [fixture.partner.id]
        }
      });
    });

    const notifications = await prisma.notification.findMany({
      where: {
        householdId: fixture.household.id,
        type: "review_requested"
      }
    });

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].userId, fixture.partner.id);
    assert.equal(
      notifications[0].targetHref,
      `/goals/${fixture.goal.id}#review-${reviewRequest.id}`
    );
  } finally {
    await cleanupFixture(fixture);
  }
});
