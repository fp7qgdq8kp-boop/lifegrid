import { Prisma } from "@prisma/client";

export const goalCardArgs = Prisma.validator<Prisma.GoalDefaultArgs>()({
  include: {
    pillar: true,
    ownerUser: true,
    milestones: {
      orderBy: {
        sortOrder: "asc"
      }
    },
    progressLogs: {
      orderBy: {
        createdAt: "desc"
      },
      take: 8
    },
    decisionLogs: {
      orderBy: [
        {
          status: "asc"
        },
        {
          updatedAt: "desc"
        }
      ]
    }
  }
});

export type GoalCardData = Prisma.GoalGetPayload<typeof goalCardArgs>;

export const pillarWithGoalsArgs = Prisma.validator<Prisma.PillarDefaultArgs>()({
  include: {
    goals: {
      include: goalCardArgs.include,
      orderBy: [
        {
          status: "asc"
        },
        {
          updatedAt: "desc"
        }
      ]
    }
  }
});

export type PillarWithGoals = Prisma.PillarGetPayload<typeof pillarWithGoalsArgs>;

export const activityEventArgs = Prisma.validator<Prisma.ActivityEventDefaultArgs>()({
  include: {
    user: true
  }
});

export type ActivityEventWithUser = Prisma.ActivityEventGetPayload<typeof activityEventArgs>;

export const weeklyReviewArgs = Prisma.validator<Prisma.WeeklyReviewDefaultArgs>()({
  include: {
    createdByUser: true
  }
});

export type WeeklyReviewWithAuthor = Prisma.WeeklyReviewGetPayload<typeof weeklyReviewArgs>;
