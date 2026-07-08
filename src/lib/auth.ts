import { prisma } from "@/lib/prisma";

export async function getViewerContext() {
  const membership = await prisma.householdMember.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      household: true,
      user: true
    }
  });

  if (!membership) {
    throw new Error("No household found. Seed the database before loading LifeGrid.");
  }

  return {
    household: membership.household,
    user: membership.user
  };
}

