"use client";

import type { FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { completeGoalAction } from "@/actions/lifegrid";
import { Button } from "@/components/ui/button";

export function CompleteGoalButton({
  goalId,
  isCompleted,
  openMilestoneCount = 0
}: {
  goalId: string;
  isCompleted: boolean;
  openMilestoneCount?: number;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const message = openMilestoneCount
      ? `Mark this goal complete? This will also complete ${openMilestoneCount} open milestone${
          openMilestoneCount === 1 ? "" : "s"
        }.`
      : "Mark this goal complete?";

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  if (isCompleted) {
    return (
      <Button type="button" variant="outline" disabled>
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </Button>
    );
  }

  return (
    <form action={completeGoalAction} onSubmit={handleSubmit}>
      <input type="hidden" name="goalId" value={goalId} />
      <Button type="submit" variant="secondary" className="w-full">
        <CheckCircle2 className="h-4 w-4" />
        Mark Complete
      </Button>
    </form>
  );
}
