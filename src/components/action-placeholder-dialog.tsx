"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export function ActionPlaceholderDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "default",
  children
}: {
  title: string;
  description: string;
  triggerLabel: string;
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
  children?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50/85">
          {children ?? (
            <p>
              This control is wired as a product interaction placeholder. The next pass can connect
              it to the database once the workflow is finalized.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
