"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Compass,
  LayoutDashboard,
  NotebookPen,
  Target
} from "lucide-react";

import { navigation } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  Dashboard: LayoutDashboard,
  "Life Pillars": Compass,
  Goals: Target,
  "Weekly Review": NotebookPen,
  Activity
};

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navigation.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = iconMap[item.label];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group rounded-2xl border px-4 py-3 transition",
              isActive
                ? "border-cyan-400/25 bg-cyan-400/10 text-white"
                : "border-transparent bg-transparent text-foreground/70 hover:border-white/10 hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-xl p-2",
                  isActive ? "bg-cyan-300/15 text-cyan-100" : "bg-white/5 text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">{item.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
