"use client";

import type { FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { completeMilestoneAction } from "@/actions/lifegrid";
import { Button } from "@/components/ui/button";

export function CompleteMilestoneButton({
  milestoneId,
  hasSavedDetails,
  isCompleted = false
}: {
  milestoneId: string;
  hasSavedDetails: boolean;
  isCompleted?: boolean;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (hasSavedDetails) {
      return;
    }

    const shouldComplete = window.confirm(
      "You haven't saved any details for this milestone yet. Complete anyway?"
    );

    if (!shouldComplete) {
      event.preventDefault();
    }
  }

  if (isCompleted) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </Button>
    );
  }

  return (
    <form action={completeMilestoneAction} onSubmit={handleSubmit}>
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <Button type="submit" variant="outline" size="sm">
        <CheckCircle2 className="h-4 w-4" />
        Mark Complete
      </Button>
    </form>
  );
}
