"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Compass,
  LayoutDashboard,
  NotebookPen,
  Target
} from "lucide-react";

import { navigation } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  Home: LayoutDashboard,
  Pillars: Compass,
  Goals: Target,
  Review: NotebookPen,
  Updates: Bell,
  History: Activity
};

export function SidebarNav({ unreadNotificationCount = 0 }: { unreadNotificationCount?: number }) {
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
                  "relative rounded-xl p-2",
                  isActive ? "bg-cyan-300/15 text-cyan-100" : "bg-white/5 text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.href === "/notifications" && unreadNotificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-slate-950 bg-cyan-300 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-slate-950">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
