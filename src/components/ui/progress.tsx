"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export function Progress({
  className,
  value
}: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  value?: number;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-2.5 overflow-hidden rounded-full bg-white/8", className)}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

