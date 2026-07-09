"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createDecisionLogAction,
  updateDecisionLogAction
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/action-state";
import {
  decisionLogCategoryOptions,
  decisionLogStatusOptions
} from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";

type DecisionLogFormData = {
  id: string;
  title: string;
  category: string;
  status: string;
  decision: string;
  reason: string;
  reviewDate: Date | null;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function DecisionLogFormDialog({
  goalId,
  decisionLog,
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "default"
}: {
  goalId: string;
  decisionLog?: DecisionLogFormData;
  triggerLabel: string;
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const action = decisionLog ? updateDecisionLogAction : createDecisionLogAction;
  const [state, formAction, pending] = useActionState(action, initialFormState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{decisionLog ? "Edit decision" : "Add decision"}</DialogTitle>
          <DialogDescription>
            Capture what was chosen, why it mattered, and when it should be reviewed.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="goalId" value={goalId} />
          {decisionLog ? (
            <input type="hidden" name="decisionLogId" value={decisionLog.id} />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor={`decision-title-${decisionLog?.id ?? "new"}`}>Title</Label>
              <Input
                id={`decision-title-${decisionLog?.id ?? "new"}`}
                name="title"
                defaultValue={decisionLog?.title ?? ""}
                placeholder="Focus on Dunnellon and Williston"
              />
              <FieldError message={state.fieldErrors?.title?.[0]} />
            </div>

            <div>
              <Label htmlFor={`decision-category-${decisionLog?.id ?? "new"}`}>Category</Label>
              <select
                id={`decision-category-${decisionLog?.id ?? "new"}`}
                name="category"
                defaultValue={decisionLog?.category ?? "decision"}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                {decisionLogCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950">
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.category?.[0]} />
            </div>

            <div>
              <Label htmlFor={`decision-status-${decisionLog?.id ?? "new"}`}>Status</Label>
              <select
                id={`decision-status-${decisionLog?.id ?? "new"}`}
                name="status"
                defaultValue={decisionLog?.status ?? "active"}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                {decisionLogStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950">
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.status?.[0]} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`decision-body-${decisionLog?.id ?? "new"}`}>Decision</Label>
              <Textarea
                id={`decision-body-${decisionLog?.id ?? "new"}`}
                name="decision"
                defaultValue={decisionLog?.decision ?? ""}
                className="min-h-[112px]"
                placeholder="What was chosen, rejected, learned, or recorded?"
              />
              <FieldError message={state.fieldErrors?.decision?.[0]} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`decision-reason-${decisionLog?.id ?? "new"}`}>Reason</Label>
              <Textarea
                id={`decision-reason-${decisionLog?.id ?? "new"}`}
                name="reason"
                defaultValue={decisionLog?.reason ?? ""}
                className="min-h-[112px]"
                placeholder="Why did this choice make sense at the time?"
              />
              <FieldError message={state.fieldErrors?.reason?.[0]} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor={`decision-review-${decisionLog?.id ?? "new"}`}>
                Review date optional
              </Label>
              <Input
                id={`decision-review-${decisionLog?.id ?? "new"}`}
                name="reviewDate"
                type="date"
                defaultValue={toDateInputValue(decisionLog?.reviewDate)}
              />
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
              {pending ? "Saving..." : decisionLog ? "Save decision" : "Add decision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
