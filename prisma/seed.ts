import {
  GoalStatus,
  GoalType,
  HouseholdMemberRole,
  MilestoneStatus,
  PrismaClient
} from "@prisma/client";

const prisma = new PrismaClient();

const pillarDefinitions = [
  {
    name: "Money",
    description: "Debt strategy, emergency margin, and long-term financial stability.",
    icon: "wallet"
  },
  {
    name: "Home / Land",
    description: "Land search, housing setup, and practical decisions around place.",
    icon: "house"
  },
  {
    name: "Career",
    description: "Employment direction, skill building, and remote work momentum.",
    icon: "briefcase"
  },
  {
    name: "Business",
    description: "Products, revenue, and systems that build independent income.",
    icon: "chart-column"
  },
  {
    name: "Family",
    description: "Routines, rhythms, and the systems that reduce chaos at home.",
    icon: "users"
  },
  {
    name: "Health",
    description: "Energy, recovery, and daily capacity for the long haul.",
    icon: "heart-pulse"
  },
  {
    name: "Relationship",
    description: "Shared alignment, communication, and intentional time together.",
    icon: "heart-handshake"
  }
] as const;

type GoalSeed = {
  pillarName: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  nextAction: string;
  blocker?: string | null;
  milestones?: string[];
};

const goalSeeds: GoalSeed[] = [
  {
    pillarName: "Money",
    title: "Debt Freedom",
    goalType: GoalType.DEBT,
    targetValue: 45000,
    currentValue: 0,
    unit: "dollars",
    nextAction: "Confirm exact debt balances and monthly payments"
  },
  {
    pillarName: "Money",
    title: "Emergency Fund",
    goalType: GoalType.MONEY,
    targetValue: 10000,
    currentValue: 0,
    unit: "dollars",
    nextAction: "Decide first savings target after debt plan"
  },
  {
    pillarName: "Home / Land",
    title: "Land + Home Plan",
    description:
      "Buy acreage and set up a manufactured or modular home for the family.",
    goalType: GoalType.CHECKLIST,
    nextAction: "Define hard land criteria",
    milestones: [
      "Choose target counties",
      "Set max land price",
      "Confirm financing path",
      "Find candidate parcels",
      "Check zoning and restrictions",
      "Estimate well, septic, and clearing",
      "Make offer",
      "Close on land",
      "Start home setup"
    ]
  },
  {
    pillarName: "Career",
    title: "Remote IT Path",
    goalType: GoalType.CHECKLIST,
    nextAction: "Create current resume version and list missing skills",
    milestones: [
      "Update resume",
      "Build portfolio projects",
      "Apply to remote Tier 1 roles",
      "Track interviews",
      "Land remote role"
    ]
  },
  {
    pillarName: "Business",
    title: "Deadbot Revenue",
    goalType: GoalType.MONEY,
    targetValue: 1000,
    currentValue: 0,
    unit: "monthly recurring revenue",
    nextAction: "Finish next customer-facing dashboard improvement"
  },
  {
    pillarName: "Business",
    title: "Deadbot Player Portal",
    goalType: GoalType.CHECKLIST,
    nextAction: "Define data model for player identity across servers and games",
    milestones: [
      "Discord login",
      "Player profile",
      "Server stats",
      "Bounty status",
      "Economy balances",
      "Admin view",
      "Cross-game structure"
    ]
  },
  {
    pillarName: "Family",
    title: "Family Routine Stability",
    goalType: GoalType.CHECKLIST,
    nextAction: "Pick one routine to improve first",
    milestones: [
      "Morning routine",
      "School/learning routine",
      "Chore routine",
      "Weekly family reset"
    ]
  },
  {
    pillarName: "Relationship",
    title: "Jay + Skye Weekly Life Check-In",
    goalType: GoalType.RECURRING,
    nextAction: "Choose day and time for weekly review"
  }
];

async function main() {
  const [jay, skye] = await Promise.all([
    prisma.user.upsert({
      where: { email: "jay@lifegrid.local" },
      update: { name: "Jay" },
      create: { name: "Jay", email: "jay@lifegrid.local" }
    }),
    prisma.user.upsert({
      where: { email: "skye@lifegrid.local" },
      update: { name: "Skye" },
      create: { name: "Skye", email: "skye@lifegrid.local" }
    })
  ]);

  const existingHousehold = await prisma.household.findFirst({
    where: { name: "Bentley Family" }
  });

  if (existingHousehold) {
    await prisma.household.delete({
      where: { id: existingHousehold.id }
    });
  }

  const household = await prisma.household.create({
    data: {
      name: "Bentley Family",
      createdByUserId: jay.id,
      members: {
        create: [
          {
            userId: jay.id,
            role: HouseholdMemberRole.OWNER
          },
          {
            userId: skye.id,
            role: HouseholdMemberRole.MEMBER
          }
        ]
      }
    }
  });

  const pillars = await Promise.all(
    pillarDefinitions.map((pillar, index) =>
      prisma.pillar.create({
        data: {
          householdId: household.id,
          name: pillar.name,
          description: pillar.description,
          icon: pillar.icon,
          sortOrder: index
        }
      })
    )
  );

  const pillarMap = new Map(pillars.map((pillar) => [pillar.name, pillar]));
  const now = new Date();

  for (const [index, goalSeed] of goalSeeds.entries()) {
    const pillar = pillarMap.get(goalSeed.pillarName);

    if (!pillar) {
      throw new Error(`Missing pillar for ${goalSeed.pillarName}`);
    }

    const goal = await prisma.goal.create({
      data: {
        householdId: household.id,
        pillarId: pillar.id,
        ownerUserId: jay.id,
        title: goalSeed.title,
        description: goalSeed.description,
        goalType: goalSeed.goalType,
        targetValue: goalSeed.targetValue ?? null,
        currentValue: goalSeed.currentValue ?? null,
        unit: goalSeed.unit ?? null,
        status: GoalStatus.ACTIVE,
        nextAction: goalSeed.nextAction,
        blocker: goalSeed.blocker ?? null,
        isShared: true
      }
    });

    if (goalSeed.milestones?.length) {
      await prisma.milestone.createMany({
        data: goalSeed.milestones.map((title, milestoneIndex) => ({
          goalId: goal.id,
          title,
          sortOrder: milestoneIndex,
          status:
            milestoneIndex === 0 && goalSeed.title === "Land + Home Plan"
              ? MilestoneStatus.ACTIVE
              : MilestoneStatus.PENDING
        }))
      });
    }

    await prisma.activityEvent.create({
      data: {
        householdId: household.id,
        userId: jay.id,
        eventType: "goal.created",
        entityType: "goal",
        entityId: goal.id,
        message: `${goal.title} was added under ${pillar.name}.`,
        createdAt: new Date(now.getTime() - (goalSeeds.length - index) * 60 * 60 * 1000)
      }
    });
  }

  await prisma.activityEvent.create({
    data: {
      householdId: household.id,
      userId: jay.id,
      eventType: "household.created",
      entityType: "household",
      entityId: household.id,
      message: "Bentley Family was initialized in LifeGrid.",
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
