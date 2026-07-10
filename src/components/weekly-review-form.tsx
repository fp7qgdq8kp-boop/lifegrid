"use client";

import { useActionState } from "react";

import { createWeeklyReviewAction } from "@/actions/lifegrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialFormState } from "@/lib/action-state";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function WeeklyReviewForm({ weekStartDate }: { weekStartDate: string }) {
  const [state, formAction, pending] = useActionState(
    createWeeklyReviewAction,
    initialFormState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="weekStartDate">Week starting</Label>
        <Input id="weekStartDate" name="weekStartDate" type="date" defaultValue={weekStartDate} />
        <FieldError message={state.fieldErrors?.weekStartDate?.[0]} />
      </div>
      <div>
        <Label htmlFor="wins">Wins this week</Label>
        <Textarea id="wins" name="wins" className="min-h-[96px]" />
        <FieldError message={state.fieldErrors?.wins?.[0]} />
      </div>
      <div>
        <Label htmlFor="stuckPoints">What got stuck</Label>
        <Textarea id="stuckPoints" name="stuckPoints" className="min-h-[88px]" />
        <FieldError message={state.fieldErrors?.stuckPoints?.[0]} />
      </div>
      <div>
        <Label htmlFor="focusNextWeek">Focus for next week</Label>
        <Textarea id="focusNextWeek" name="focusNextWeek" className="min-h-[88px]" />
        <FieldError message={state.fieldErrors?.focusNextWeek?.[0]} />
      </div>
      <div>
        <Label htmlFor="cutOrPause">What to cut or pause</Label>
        <Textarea id="cutOrPause" name="cutOrPause" className="min-h-[88px]" />
        <FieldError message={state.fieldErrors?.cutOrPause?.[0]} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" className="min-h-[88px]" />
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
          {pending ? "Saving..." : "Save weekly check-in"}
        </Button>
      </div>
    </form>
  );
}
