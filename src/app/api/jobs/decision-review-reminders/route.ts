import { NextResponse } from "next/server";

import { ensureDueDecisionReviewNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const jobSecret = process.env.LIFEGRID_JOBS_SECRET;

  if (!jobSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-lifegrid-job-secret");
  const bearerSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  return bearerSecret === jobSecret || headerSecret === jobSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const households = await prisma.household.findMany({
    select: {
      id: true
    }
  });

  for (const household of households) {
    await ensureDueDecisionReviewNotifications(household.id);
  }

  return NextResponse.json({
    ok: true,
    householdsChecked: households.length
  });
}
