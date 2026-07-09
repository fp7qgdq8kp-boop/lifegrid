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

type MilestoneSeed = {
  title: string;
  description?: string;
  decisionSummary?: string;
  notes?: string;
  links?: string[];
  customFields?: Record<string, string>;
  status?: MilestoneStatus;
};

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
  milestones?: Array<string | MilestoneSeed>;
  decisionLogs?: Array<{
    title: string;
    category: string;
    status: string;
    decision: string;
    reason: string;
    reviewDate?: Date | null;
  }>;
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
      {
        title: "Choose target counties",
        decisionSummary: "Marion, Levy, and Citrus selected. Marion ranked #1.",
        notes:
          "Keep the search focused enough to compare parcels honestly instead of chasing every listing in Florida.",
        customFields: {
          selectedCounties: "Marion, Levy, Citrus",
          priorityRanking: "1. Marion\n2. Levy\n3. Citrus",
          pros: "Good acreage supply, privacy, and manufactured/modular possibilities.",
          cons: "Must verify restrictions parcel by parcel.",
          distanceConsiderations: "Prefer reasonable access to Dunnellon, Williston, and core family needs.",
          schoolWorkFamilyConsiderations:
            "Keep drive times practical for work, school, groceries, and family support.",
          notes: "Use county shortlist before spending time on parcel details.",
          finalDecision: "Use Marion as the primary search county with Levy and Citrus as backups."
        },
        status: MilestoneStatus.ACTIVE
      },
      {
        title: "Set max land price",
        decisionSummary: "Max land budget set to $90,000. Preferred range: $50,000-$75,000.",
        customFields: {
          maxLandPrice: "$90,000",
          preferredPriceRange: "$50,000-$75,000",
          maxPricePerAcre: "Depends on utilities, access, and clearing needs.",
          cashAvailable: "Confirm current cash position before offer.",
          estimatedUtilityBuffer: "Hold back setup buffer for well, septic, clearing, driveway, and power.",
          hardNoNumber: "Do not exceed $90,000 unless setup costs are unusually low.",
          notesReasoning:
            "Land price has to be evaluated with site-prep costs, not as a standalone listing price."
        }
      },
      {
        title: "Confirm financing path",
        decisionSummary: "Compare cash, land loan, seller financing, and manufactured-home package options.",
        customFields: {
          financingOptionsConsidered:
            "Cash, land loan, seller financing, manufactured/modular home package financing.",
          chosenFinancingPath: "Not finalized.",
          lenderName: "To research",
          downPaymentNeeded: "To confirm by lender",
          creditScoreRequirement: "To confirm by lender",
          estimatedMonthlyPayment: "To model after price range is final",
          approvalStatus: "Researching",
          documentsNeeded: "Pay stubs, tax returns, debt list, bank statements.",
          notes: "Financing choice may change which parcels are realistic."
        }
      },
      {
        title: "Find candidate parcels",
        decisionSummary: "4 parcels saved. 1 top choice, 2 maybe, 1 rejected.",
        customFields: {
          parcelName: "Parcel shortlist",
          addressLocation: "Track exact addresses in listing links.",
          listingUrl: "",
          county: "Marion / Levy / Citrus",
          acres: "Compare acreage against price and setup work.",
          price: "Track listing price per parcel.",
          pricePerAcre: "Calculate for each candidate.",
          zoning: "Verify before ranking.",
          floodZone: "Reject high-risk flood zone unless strongly justified.",
          roadAccess: "Prefer legal, maintained access.",
          wellStatus: "Unknown until listing or county record confirms.",
          septicStatus: "Unknown until listing or county record confirms.",
          manufacturedModularAllowed: "unknown",
          clearingNeeded: "Score as low, medium, or high.",
          savedStatus: "top choice",
          scoreRanking: "1 top choice, 2 maybe, 1 rejected.",
          notes: "Keep rejected parcels visible with reasons so the same mistake is not repeated."
        }
      },
      {
        title: "Check zoning and restrictions",
        customFields: {
          zoningCode: "Verify per parcel",
          allowedUses: "Confirm residential use and home type before offer.",
          manufacturedHomeAllowed: "unknown",
          modularHomeAllowed: "unknown",
          hoa: "unknown",
          deedRestrictions: "Reject restrictions that block the home plan.",
          minimumHomeSize: "Verify county and deed rules.",
          setbacks: "Confirm before assuming house placement.",
          livestockAgriculturalRules: "Check only if parcel use needs it.",
          sourceUrlOrDocumentReference: "Save county zoning or deed source here.",
          verifiedDate: "",
          notes: "Restrictions can make a cheap parcel unusable."
        }
      },
      {
        title: "Estimate well, septic, and clearing",
        customFields: {
          wellEstimate: "Get quote",
          septicEstimate: "Get quote",
          clearingEstimate: "Get quote",
          drivewayEstimate: "Get quote",
          powerEstimate: "Check distance to nearest power",
          quoteSource: "Save contractor names, calls, or written estimates.",
          diyPossible: "unknown",
          totalEstimatedSitePrepCost: "Not calculated yet",
          notes: "Use total site-prep cost to compare parcels, not just land price."
        }
      },
      {
        title: "Make offer",
        customFields: {
          askingPrice: "Use selected parcel listing price.",
          offerAmount: "Set after restrictions and site-prep estimate are verified.",
          contingencies: "Financing, zoning/restrictions, inspection, title, survey if needed.",
          closingCostPlan: "Confirm buyer/seller split before offer.",
          sellerResponse: "Not started.",
          counteroffer: "Not started.",
          offerStatus: "Not started.",
          notes: "Offer should not happen until zoning and setup costs are understood."
        }
      },
      "Close on land",
      "Start home setup"
    ],
    decisionLogs: [
      {
        title: "Focus on Dunnellon and Williston",
        category: "decision",
        status: "active",
        decision: "Prioritize Dunnellon and Williston as target areas for acreage.",
        reason:
          "Better privacy, acreage options, and likely better fit for manufactured/modular home plans."
      },
      {
        title: "Avoid HOA or heavily restricted parcels",
        category: "rejection",
        status: "active",
        decision:
          "Reject parcels with HOA rules or restrictions that block manufactured/modular homes.",
        reason:
          "The family needs flexibility, privacy, and fewer land-use restrictions."
      },
      {
        title: "Include well and septic costs in land budget",
        category: "research",
        status: "active",
        decision: "Treat well, septic, and clearing as part of the real land cost.",
        reason:
          "A cheaper parcel may not actually be cheaper if setup costs are high."
      }
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
        data: goalSeed.milestones.map((milestoneSeed, milestoneIndex) => {
          const milestone =
            typeof milestoneSeed === "string"
              ? { title: milestoneSeed }
              : milestoneSeed;

          return {
            goalId: goal.id,
            title: milestone.title,
            description: milestone.description,
            decisionSummary: milestone.decisionSummary,
            notes: milestone.notes,
            links: milestone.links ?? [],
            customFields: milestone.customFields ?? {},
            sortOrder: milestoneIndex,
            status:
              milestone.status ??
              (milestoneIndex === 0 && goalSeed.title === "Land + Home Plan"
                ? MilestoneStatus.ACTIVE
                : MilestoneStatus.PENDING)
          };
        })
      });
    }

    const goalActivityCreatedAt = new Date(
      now.getTime() - (goalSeeds.length - index) * 60 * 60 * 1000
    );

    await prisma.activityEvent.create({
      data: {
        householdId: household.id,
        userId: jay.id,
        goalId: goal.id,
        eventType: "goal.created",
        entityType: "goal",
        entityId: goal.id,
        action: "created",
        newValue: {
          title: goal.title,
          status: goal.status,
          pillarName: pillar.name
        },
        metadata: {
          goalTitle: goal.title,
          pillarName: pillar.name,
          isShared: goal.isShared
        },
        message: `${goal.title} was added under ${pillar.name}.`,
        createdAt: goalActivityCreatedAt
      }
    });

    if (goalSeed.decisionLogs?.length) {
      for (const [decisionIndex, decisionLogSeed] of goalSeed.decisionLogs.entries()) {
        const decisionLog = await prisma.decisionLog.create({
          data: {
            householdId: household.id,
            goalId: goal.id,
            userId: jay.id,
            title: decisionLogSeed.title,
            category: decisionLogSeed.category,
            status: decisionLogSeed.status,
            decision: decisionLogSeed.decision,
            reason: decisionLogSeed.reason,
            reviewDate: decisionLogSeed.reviewDate ?? null
          }
        });

        await prisma.activityEvent.create({
          data: {
            householdId: household.id,
            userId: jay.id,
            goalId: goal.id,
            eventType: "decision-log.created",
            entityType: "decision-log",
            entityId: decisionLog.id,
            action: "created",
            newValue: {
              title: decisionLog.title,
              category: decisionLog.category,
              status: decisionLog.status,
              reviewDate: decisionLog.reviewDate?.toISOString() ?? null
            },
            metadata: {
              goalTitle: goal.title,
              decisionTitle: decisionLog.title
            },
            message: `Decision logged for ${goal.title}: ${decisionLog.title}.`,
            createdAt: new Date(
              goalActivityCreatedAt.getTime() + (decisionIndex + 1) * 5 * 60 * 1000
            )
          }
        });
      }
    }
  }

  await prisma.activityEvent.create({
    data: {
      householdId: household.id,
      userId: jay.id,
      eventType: "household.created",
      entityType: "household",
      entityId: household.id,
      action: "created",
      metadata: {
        householdName: household.name
      },
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
