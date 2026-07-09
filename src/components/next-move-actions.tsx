"use client";

import { useActionState, useEffect, useId, useState } from "react";

import {
  applySuggestedNextMoveAction,
  editAndApplySuggestedNextMoveAction
} from "@/actions/lifegrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/action-state";
import type { NextStepCategory } from "@/lib/next-steps";
import { cn } from "@/lib/utils";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function NextMoveActions({
  goalId,
  suggestion,
  category,
  className
}: {
  goalId: string;
  suggestion: string;
  category: NextStepCategory;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    editAndApplySuggestedNextMoveAction,
    initialFormState
  );
  const nextActionId = useId();
  const blockerId = useId();

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <form action={applySuggestedNextMoveAction}>
        <input type="hidden" name="goalId" value={goalId} />
        <input type="hidden" name="suggestion" value={suggestion} />
        <input type="hidden" name="category" value={category} />
        <Button type="submit" size="sm">
          Use this next move
        </Button>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="secondary" size="sm">
            Edit first
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit next move</DialogTitle>
            <DialogDescription>
              Tune the recommendation before making it the goal&apos;s next action.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="goalId" value={goalId} />
            <input type="hidden" name="category" value={category} />

            <div>
              <Label htmlFor={nextActionId}>Next action</Label>
              <Textarea
                id={nextActionId}
                name="nextAction"
                defaultValue={suggestion}
                className="min-h-[112px]"
              />
              <FieldError message={state.fieldErrors?.nextAction?.[0]} />
            </div>

            <div>
              <Label htmlFor={blockerId}>Blocker optional</Label>
              <Textarea
                id={blockerId}
                name="blocker"
                className="min-h-[92px]"
                placeholder={
                  category === "blocked_goal"
                    ? "Leave blank to keep the current blocker."
                    : "Leave blank to clear the blocker."
                }
              />
              <FieldError message={state.fieldErrors?.blocker?.[0]} />
            </div>

            {state.message ? (
              <p
                className={
                  state.status === "error"
                    ? "text-sm text-red-300"
                    : "text-sm text-emerald-300"
                }
              >
                {state.message}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save next move"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
