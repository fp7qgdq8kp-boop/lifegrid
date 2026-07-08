import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  HeartHandshake,
  HeartPulse,
  Home,
  Layers3,
  Users,
  Wallet
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/progress-bar";
import { formatPercent } from "@/lib/format";
import { calculateGoalProgress, calculatePillarProgress } from "@/lib/progress";
import type { PillarWithGoals } from "@/lib/types";

type PillarCardData = PillarWithGoals & {
  progress?: number;
};

type PillarVisual = {
  icon: LucideIcon;
  accent: string;
  panel: string;
  glow: string;
};

const pillarVisuals: Record<string, PillarVisual> = {
  Money: {
    icon: Wallet,
    accent: "text-emerald-100 border-emerald-300/20 bg-emerald-400/10",
    panel: "from-emerald-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-emerald-950/30"
  },
  "Home / Land": {
    icon: Home,
    accent: "text-sky-100 border-sky-300/20 bg-sky-400/10",
    panel: "from-sky-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-sky-950/30"
  },
  Career: {
    icon: Briefcase,
    accent: "text-blue-100 border-blue-300/20 bg-blue-400/10",
    panel: "from-blue-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-blue-950/30"
  },
  Business: {
    icon: BarChart3,
    accent: "text-cyan-100 border-cyan-300/20 bg-cyan-400/10",
    panel: "from-cyan-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-cyan-950/30"
  },
  Family: {
    icon: Users,
    accent: "text-orange-100 border-orange-300/20 bg-orange-400/10",
    panel: "from-orange-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-orange-950/30"
  },
  Health: {
    icon: HeartPulse,
    accent: "text-rose-100 border-rose-300/20 bg-rose-400/10",
    panel: "from-rose-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-rose-950/30"
  },
  Relationship: {
    icon: HeartHandshake,
    accent: "text-fuchsia-100 border-fuchsia-300/20 bg-fuchsia-400/10",
    panel: "from-fuchsia-400/15 via-white/[0.035] to-transparent",
    glow: "shadow-fuchsia-950/30"
  }
};

const defaultPillarVisual: PillarVisual = {
  icon: Layers3,
  accent: "text-cyan-100 border-cyan-300/20 bg-cyan-400/10",
  panel: "from-cyan-400/15 via-white/[0.035] to-transparent",
  glow: "shadow-cyan-950/30"
};

function getPillarVisual(name: string) {
  return pillarVisuals[name] ?? defaultPillarVisual;
}

export function PillarCard({ pillar }: { pillar: PillarCardData }) {
  const visual = getPillarVisual(pillar.name);
  const Icon = visual.icon;
  const activeGoals = pillar.goals.filter((goal) => goal.status === "ACTIVE");
  const missingNextActions = activeGoals.filter((goal) => !goal.nextAction?.trim()).length;
  const blockedGoals = activeGoals.filter((goal) => goal.blocker?.trim()).length;
  const progress = pillar.progress ?? calculatePillarProgress(pillar.goals);
  const topGoals = activeGoals
    .map((goal) => ({ goal, progress: calculateGoalProgress(goal) }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  return (
    <article
      className={`relative h-full overflow-hidden rounded-2xl border border-white/8 bg-card/85 p-4 shadow-panel ${visual.glow}`}
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${visual.panel}`} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className={`rounded-2xl border p-3 ${visual.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant={progress >= 50 ? "success" : progress ? "accent" : "default"}>
            {formatPercent(progress)}
          </Badge>
        </div>

        <div className="mt-4">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-white">
            {pillar.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300/75">{pillar.description}</p>
        </div>

        <ProgressBar
          value={progress}
          detail={`${activeGoals.length} active goals`}
          tone={missingNextActions || blockedGoals ? "warning" : "default"}
          className="mt-4"
        />

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
            <p className="font-semibold text-white">{missingNextActions}</p>
            <p className="mt-1 text-slate-400">missing next</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
            <p className="font-semibold text-white">{blockedGoals}</p>
            <p className="mt-1 text-slate-400">blocked</p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          {topGoals.length ? (
            topGoals.map(({ goal, progress: goalProgress }) => (
              <Link
                key={goal.id}
                href={`/goals/${goal.id}`}
                className="rounded-xl border border-white/8 bg-slate-950/35 p-3 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-white">{goal.title}</p>
                  <span className="shrink-0 text-xs text-cyan-100">
                    {formatPercent(goalProgress)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                  {goal.nextAction || "Needs a next action."}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/25 p-3 text-sm leading-6 text-slate-400">
              No active goals in this pillar yet.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
