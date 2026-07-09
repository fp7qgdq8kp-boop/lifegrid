"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, ExternalLink, FileText, ListChecks, Pencil } from "lucide-react";

import { updateMilestoneAction } from "@/actions/lifegrid";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, formatRelativeDate } from "@/lib/format";
import {
  getMilestoneFieldRows,
  getMilestoneLinks,
  milestoneLinksToText,
  type MilestoneFieldDefinition,
  type MilestoneFieldRow
} from "@/lib/milestones";

type MilestoneDetailData = {
  id: string;
  title: string;
  description: string | null;
  decisionSummary: string | null;
  notes: string | null;
  links: unknown;
  customFields: unknown;
  status: string;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  updatedAt: Date | string;
};

type DialogMode = "review" | "edit";

const milestoneStatusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" }
];

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "ACTIVE") return "accent" as const;
  return "default" as const;
}

function DetailBlock({
  title,
  children,
  empty = "Nothing saved yet."
}: {
  title: string;
  children?: ReactNode;
  empty?: string;
}) {
  const hasChildren = Boolean(children);

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <div className="mt-3 text-sm leading-6 text-slate-200/85">
        {hasChildren ? children : <p className="text-slate-400">{empty}</p>}
      </div>
    </section>
  );
}

function CustomFieldInput({ row }: { row: MilestoneFieldRow }) {
  const inputType = row.definition?.input ?? "text";
  const id = `milestone-field-${row.key}`;
  const name = `customFields.${row.key}`;

  if (inputType === "select") {
    return (
      <div>
        <Label htmlFor={id}>{row.label}</Label>
        <select
          id={id}
          name={name}
          defaultValue={row.value}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
        >
          <option value="" className="bg-slate-950">
            Not set
          </option>
          {(row.definition?.options ?? []).map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-950">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (inputType === "textarea") {
    return (
      <div className="md:col-span-2">
        <Label htmlFor={id}>{row.label}</Label>
        <Textarea
          id={id}
          name={name}
          defaultValue={row.value}
          placeholder={row.definition?.placeholder}
          className="min-h-[88px]"
        />
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id}>{row.label}</Label>
      <Input
        id={id}
        name={name}
        type={inputType}
        defaultValue={row.value}
        placeholder={row.definition?.placeholder}
      />
    </div>
  );
}

export function MilestoneDetailDialog({
  goalTitle,
  milestone,
  fieldDefinitions,
  triggerLabel,
  initialMode = "review",
  triggerVariant = "secondary",
  triggerSize = "sm"
}: {
  goalTitle: string;
  milestone: MilestoneDetailData;
  fieldDefinitions: MilestoneFieldDefinition[];
  triggerLabel: string;
  initialMode?: DialogMode;
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>(initialMode);
  const [state, formAction, pending] = useActionState(
    updateMilestoneAction,
    initialFormState
  );
  const fieldRows = useMemo(
    () => getMilestoneFieldRows(milestone.customFields, fieldDefinitions),
    [fieldDefinitions, milestone.customFields]
  );
  const populatedFieldRows = fieldRows.filter((row) => row.value.trim().length > 0);
  const links = getMilestoneLinks(milestone.links);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [initialMode, open]);

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
      <DialogContent className="w-[min(94vw,860px)] p-0">
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 pr-6 sm:p-6">
          {mode === "review" ? (
            <>
              <DialogHeader className="pr-10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{goalTitle}</Badge>
                  <Badge variant={statusVariant(milestone.status)}>
                    {humanize(milestone.status)}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{milestone.title}</DialogTitle>
                <DialogDescription>
                  Review the information, reasoning, references, and outcome behind this
                  milestone.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <DetailBlock title="Decision Summary">
                  {milestone.decisionSummary ? <p>{milestone.decisionSummary}</p> : null}
                </DetailBlock>

                <DetailBlock title="Notes">
                  {milestone.notes ? (
                    <p className="whitespace-pre-wrap">{milestone.notes}</p>
                  ) : null}
                </DetailBlock>

                <DetailBlock title="Structured Fields">
                  {populatedFieldRows.length ? (
                    <dl className="grid gap-3 md:grid-cols-2">
                      {populatedFieldRows.map((row) => (
                        <div
                          key={row.key}
                          className="rounded-xl border border-white/8 bg-slate-950/35 p-3"
                        >
                          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {row.label}
                          </dt>
                          <dd className="mt-2 whitespace-pre-wrap text-slate-200/85">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : fieldDefinitions.length ? (
                    <p className="text-slate-400">
                      This milestone has structured fields ready, but none have been filled yet.
                    </p>
                  ) : null}
                </DetailBlock>

                <DetailBlock title="Links / References">
                  {links.length ? (
                    <div className="space-y-2">
                      {links.map((link, index) =>
                        link.href ? (
                          <a
                            key={`${link.label}-${index}`}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 break-all text-cyan-100 hover:text-cyan-50"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0" />
                            {link.label}
                          </a>
                        ) : (
                          <p key={`${link.label}-${index}`} className="break-words">
                            {link.label}
                          </p>
                        )
                      )}
                    </div>
                  ) : null}
                </DetailBlock>

                {milestone.description ? (
                  <DetailBlock title="Original Context">
                    <p className="whitespace-pre-wrap">{milestone.description}</p>
                  </DetailBlock>
                ) : null}

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CalendarClock className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                        Last Updated
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-medium text-white">
                      {formatDate(milestone.updatedAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatRelativeDate(milestone.updatedAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ListChecks className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                        Completed
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-medium text-white">
                      {milestone.completedAt ? formatDate(milestone.completedAt) : "Not completed"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                        Due Date
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-medium text-white">
                      {milestone.dueDate ? formatDate(milestone.dueDate) : "No due date"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setMode("edit")}>
                    <Pencil className="h-4 w-4" />
                    Edit Details
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="pr-10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{goalTitle}</Badge>
                  <Badge variant={statusVariant(milestone.status)}>
                    {humanize(milestone.status)}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">Edit milestone details</DialogTitle>
                <DialogDescription>
                  Completion means the decision record is good enough to move forward.
                </DialogDescription>
              </DialogHeader>

              <form action={formAction} className="space-y-5">
                <input type="hidden" name="milestoneId" value={milestone.id} />

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor={`milestone-title-${milestone.id}`}>Milestone title</Label>
                    <Input
                      id={`milestone-title-${milestone.id}`}
                      name="title"
                      defaultValue={milestone.title}
                    />
                    <FieldError message={state.fieldErrors?.title?.[0]} />
                  </div>

                  <div>
                    <Label htmlFor={`milestone-status-${milestone.id}`}>Status</Label>
                    <select
                      id={`milestone-status-${milestone.id}`}
                      name="status"
                      defaultValue={milestone.status}
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      {milestoneStatusOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-slate-950">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Last updated</Label>
                    <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm text-slate-300">
                      {formatDate(milestone.updatedAt)}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`milestone-description-${milestone.id}`}>Context</Label>
                    <Textarea
                      id={`milestone-description-${milestone.id}`}
                      name="description"
                      defaultValue={milestone.description ?? ""}
                      className="min-h-[88px]"
                      placeholder="What this checkpoint is meant to decide or clarify."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`milestone-decision-summary-${milestone.id}`}>
                      Decision summary
                    </Label>
                    <Textarea
                      id={`milestone-decision-summary-${milestone.id}`}
                      name="decisionSummary"
                      defaultValue={milestone.decisionSummary ?? ""}
                      className="min-h-[96px]"
                      placeholder="What decision has been made, or what is clear enough to move forward?"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`milestone-notes-${milestone.id}`}>Notes</Label>
                    <Textarea
                      id={`milestone-notes-${milestone.id}`}
                      name="notes"
                      defaultValue={milestone.notes ?? ""}
                      className="min-h-[120px]"
                      placeholder="Reasoning, options considered, evidence, rejected paths, or open questions."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`milestone-links-${milestone.id}`}>
                      Links / references
                    </Label>
                    <Textarea
                      id={`milestone-links-${milestone.id}`}
                      name="linksText"
                      defaultValue={milestoneLinksToText(milestone.links)}
                      className="min-h-[88px]"
                      placeholder="One URL or reference per line."
                    />
                  </div>
                </div>

                {fieldRows.length ? (
                  <div className="rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.055] p-4">
                    <div className="mb-4">
                      <p className="font-medium text-white">Custom structured fields</p>
                      <p className="mt-1 text-sm text-cyan-50/70">
                        These fields adapt to the milestone template and are stored as flexible
                        metadata.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {fieldRows.map((row) => (
                        <CustomFieldInput key={row.key} row={row} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300/80">
                    This milestone does not have template-specific fields yet. Use the summary,
                    notes, and references to capture its decision record.
                  </div>
                )}

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

                <div className="flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-400">
                    Completed date:{" "}
                    <span className="text-slate-300">
                      {milestone.completedAt ? formatDate(milestone.completedAt) : "Not completed"}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setMode("review")}>
                      Review
                    </Button>
                    <Button type="submit" disabled={pending}>
                      {pending ? "Saving..." : "Save Details"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
