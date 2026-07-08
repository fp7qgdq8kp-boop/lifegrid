import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/5 text-foreground/80",
        success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
        danger: "border-red-400/20 bg-red-400/10 text-red-100",
        accent: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

