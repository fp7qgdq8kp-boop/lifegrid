import type { ReactNode } from "react";

import { SidebarNav } from "@/components/sidebar-nav";
import { getNotificationShellData } from "@/lib/data";

export async function AppShell({ children }: { children: ReactNode }) {
  const { household, members, unreadNotificationCount, user } =
    await getNotificationShellData();
  const householdNames = members.map((member) => member.user.name).join(" + ") || "Jay + Skye";

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.9),transparent_40%)]" />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="rounded-[1.75rem] border border-white/8 bg-slate-950/80 p-5 shadow-panel backdrop-blur-sm lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:w-[320px] lg:shrink-0 lg:self-start lg:overflow-y-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/70">
              LifeGrid
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white">
              {householdNames} life board.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300/70">
              A calm place for shared goals, decisions, blockers, and the next move that matters.
            </p>
          </div>
          <SidebarNav unreadNotificationCount={unreadNotificationCount} />
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.045] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Household
            </p>
            <p className="mt-3 text-sm font-medium text-white">{householdNames}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300/70">
              {household.name}. Viewing as {user.name}.
            </p>
            <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              {unreadNotificationCount
                ? `${unreadNotificationCount} updates waiting`
                : "No updates waiting"}
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
