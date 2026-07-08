"use client";

import { useActionState, useEffect, useState } from "react";

import { updateGoalProgressAction } from "@/actions/lifegrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/action-state";

export function ProgressUpdateDialog({
  goalId,
  currentValue,
  goalType,
  nextAction,
  blocker
}: {
  goalId: string;
  currentValue: number | null;
  goalType: string;
  nextAction: string | null;
  blocker: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateGoalProgressAction,
    initialFormState
  );

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  const showNumericInput = goalType !== "CHECKLIST" && goalType !== "RECURRING";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Update progress</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log movement</DialogTitle>
          <DialogDescription>
            Record the latest progress and keep the next action current.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="goalId" value={goalId} />

          {showNumericInput ? (
            <div>
              <Label htmlFor="newValue">New current value</Label>
              <Input
                id="newValue"
                name="newValue"
                type="number"
                step="0.01"
                defaultValue={currentValue ?? ""}
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="note">What changed?</Label>
            <Textarea
              id="note"
              name="note"
              className="min-h-[96px]"
              placeholder="Capture the important context so the timeline tells the story later."
            />
          </div>

          <div>
            <Label htmlFor="nextAction">Next action</Label>
            <Textarea
              id="nextAction"
              name="nextAction"
              defaultValue={nextAction ?? ""}
              className="min-h-[88px]"
            />
          </div>

          <div>
            <Label htmlFor="blocker">Blocker</Label>
            <Textarea
              id="blocker"
              name="blocker"
              defaultValue={blocker ?? ""}
              className="min-h-[88px]"
            />
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
              {pending ? "Saving..." : "Save update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

