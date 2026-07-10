"use client";

import { useActionState, useEffect, useState } from "react";

import { createMilestoneAction } from "@/actions/lifegrid";
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
import { Input } from "@/components/ui/input";
import { initialFormState } from "@/lib/action-state";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function MilestoneFormDialog({
  goalId,
  triggerLabel = "Add Milestone",
  triggerVariant = "secondary"
}: {
  goalId: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createMilestoneAction, initialFormState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add milestone</DialogTitle>
          <DialogDescription>
            Break this plan into the next visible checkpoint.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="goalId" value={goalId} />
          <div>
            <Label htmlFor="milestone-title">Title</Label>
            <Input id="milestone-title" name="title" placeholder="Milestone title" />
            <FieldError message={state.fieldErrors?.title?.[0]} />
          </div>
          <div>
            <Label htmlFor="milestone-description">Description</Label>
            <Textarea
              id="milestone-description"
              name="description"
              className="min-h-[96px]"
              placeholder="Optional context, scope, or definition of done."
            />
          </div>

          {state.message ? (
            <p
              className={
                state.status === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"
              }
            >
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add milestone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
