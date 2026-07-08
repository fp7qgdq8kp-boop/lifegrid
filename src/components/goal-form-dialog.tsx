"use client";

import { useActionState, useEffect, useState } from "react";

import { createGoalAction, updateGoalAction } from "@/actions/lifegrid";
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
import { goalStatusOptions, goalTypeOptions } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

type PillarOption = {
  id: string;
  name: string;
};

type GoalFormGoal = {
  id: string;
  title: string;
  description: string | null;
  pillarId: string;
  goalType: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  status: string;
  deadline: Date | null;
  nextAction: string | null;
  blocker: string | null;
  isShared: boolean;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function GoalFormDialog({
  pillars,
  goal,
  triggerLabel,
  triggerVariant = "default"
}: {
  pillars: PillarOption[];
  goal?: GoalFormGoal;
  triggerLabel: string;
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState(goal?.goalType ?? "CHECKLIST");
  const action = goal ? updateGoalAction : createGoalAction;
  const [state, formAction, pending] = useActionState(action, initialFormState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  const showNumericFields = goalType !== "CHECKLIST" && goalType !== "RECURRING";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "Create a new goal"}</DialogTitle>
          <DialogDescription>
            Keep goals concrete, calm, and connected to the next visible move.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          {goal ? <input type="hidden" name="goalId" value={goal.id} /> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={goal?.title ?? ""} />
              <FieldError message={state.fieldErrors?.title?.[0]} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={goal?.description ?? ""}
                className="min-h-[96px]"
              />
            </div>

            <div>
              <Label htmlFor="pillarId">Pillar</Label>
              <select
                id="pillarId"
                name="pillarId"
                defaultValue={goal?.pillarId ?? pillars[0]?.id ?? ""}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                {pillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.id} className="bg-slate-950">
                    {pillar.name}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.pillarId?.[0]} />
            </div>

            <div>
              <Label htmlFor="goalType">Goal type</Label>
              <select
                id="goalType"
                name="goalType"
                value={goalType}
                onChange={(event) => setGoalType(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                {goalTypeOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {showNumericFields ? (
              <>
                <div>
                  <Label htmlFor="targetValue">Target value</Label>
                  <Input
                    id="targetValue"
                    name="targetValue"
                    type="number"
                    step="0.01"
                    defaultValue={goal?.targetValue ?? ""}
                  />
                </div>
                <div>
                  <Label htmlFor="currentValue">Current value</Label>
                  <Input
                    id="currentValue"
                    name="currentValue"
                    type="number"
                    step="0.01"
                    defaultValue={goal?.currentValue ?? ""}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    name="unit"
                    placeholder="dollars, sessions, percent, monthly recurring revenue..."
                    defaultValue={goal?.unit ?? ""}
                  />
                </div>
              </>
            ) : (
              <>
                <input type="hidden" name="targetValue" value={goal?.targetValue ?? ""} />
                <input type="hidden" name="currentValue" value={goal?.currentValue ?? ""} />
                <input type="hidden" name="unit" value={goal?.unit ?? ""} />
                <div className="md:col-span-2 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  {goalType === "CHECKLIST"
                    ? "Checklist progress is driven by milestone completion."
                    : "Recurring goals stay focused on rhythm and next action instead of a numeric target."}
                </div>
              </>
            )}

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={goal?.status ?? "ACTIVE"}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                {goalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={toDateInputValue(goal?.deadline)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="nextAction">Next action</Label>
              <Textarea
                id="nextAction"
                name="nextAction"
                defaultValue={goal?.nextAction ?? ""}
                className={cn(
                  "min-h-[88px]",
                  !goal?.nextAction ? "border-amber-400/20 bg-amber-400/5" : undefined
                )}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="blocker">Blocker</Label>
              <Textarea
                id="blocker"
                name="blocker"
                defaultValue={goal?.blocker ?? ""}
                className="min-h-[88px]"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="isShared">Visibility</Label>
              <select
                id="isShared"
                name="isShared"
                defaultValue={goal?.isShared === false ? "false" : "true"}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="true" className="bg-slate-950">
                  Shared with household
                </option>
                <option value="false" className="bg-slate-950">
                  Personal
                </option>
              </select>
            </div>
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
              {pending ? "Saving..." : goal ? "Save changes" : "Create goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
