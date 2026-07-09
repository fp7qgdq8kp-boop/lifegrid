import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, CircleDot, SlidersHorizontal } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferencesAction
} from "@/actions/lifegrid";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotificationsPageData } from "@/lib/data";
import { formatRelativeDate } from "@/lib/format";
import type { NotificationWithContext } from "@/lib/types";

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function notificationVariant(type: string) {
  if (type.includes("decision")) return "accent" as const;
  if (type.includes("milestone") || type.includes("threshold")) return "success" as const;
  if (type.includes("review")) return "warning" as const;
  if (type.includes("status")) return "danger" as const;
  return "default" as const;
}

function NotificationCard({ notification }: { notification: NotificationWithContext }) {
  const isUnread = !notification.readAt;
  const targetHref = notification.targetHref ?? "/notifications";

  return (
    <article
      className={
        isUnread
          ? "rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.075] p-4 shadow-lg shadow-cyan-950/20"
          : "rounded-2xl border border-white/8 bg-white/[0.03] p-4"
      }
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={notificationVariant(notification.type)}>
              {humanize(notification.type)}
            </Badge>
            {isUnread ? (
              <Badge variant="accent" className="gap-1">
                <CircleDot className="h-3 w-3" />
                Unread
              </Badge>
            ) : (
              <Badge className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Read
              </Badge>
            )}
            {notification.goal ? <Badge>{notification.goal.title}</Badge> : null}
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">{notification.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300/85">{notification.message}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>{notification.actorUser?.name ?? "LifeGrid"}</span>
            <span>{formatRelativeDate(notification.createdAt)}</span>
            {notification.goal?.pillar ? <span>{notification.goal.pillar.name}</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <Button asChild size="sm">
            <Link href={targetHref}>
              Open
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {isUnread ? (
            <form action={markNotificationReadAction}>
              <input type="hidden" name="notificationId" value={notification.id} />
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Mark read
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type NotificationPreferenceView = Awaited<
  ReturnType<typeof getNotificationsPageData>
>["notificationPreferences"][number];

function NotificationPreferencePanel({
  preferences
}: {
  preferences: NotificationPreferenceView[];
}) {
  const enabledCount = preferences.filter((preference) => preference.inAppEnabled).length;

  return (
    <Card>
      <CardHeader className="border-b border-white/8 bg-white/[0.025]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-cyan-100" />
              Notification preferences
            </CardTitle>
            <CardDescription>
              Choose which future in-app updates should reach your command center.
            </CardDescription>
          </div>
          <Badge variant="accent">
            {enabledCount} of {preferences.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={updateNotificationPreferencesAction} className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-2">
            {preferences.map((preference) => {
              const inputId = `notification-${preference.value}`;

              return (
                <label
                  key={preference.value}
                  htmlFor={inputId}
                  className="flex min-h-28 cursor-pointer gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-400/[0.055]"
                >
                  <input
                    id={inputId}
                    name="inAppEnabled"
                    value={preference.value}
                    type="checkbox"
                    defaultChecked={preference.inAppEnabled}
                    className="mt-1 h-5 w-5 shrink-0 accent-cyan-300"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{preference.label}</span>
                      <Badge variant="accent">In-app</Badge>
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-300/75">
                      {preference.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Preferences apply to new notifications. Existing notifications stay in your inbox.
            </p>
            <Button type="submit">Save preferences</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default async function NotificationsPage() {
  const { notifications, unreadNotificationCount, notificationPreferences } =
    await getNotificationsPageData();

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-[2rem] border border-white/8 bg-slate-950/70 p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200/70">
              Notifications
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold text-white">
              Meaningful movement, not noise.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/75">
              Partner updates, decision changes, milestones, progress thresholds, and review moments
              land here when they need attention.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-center">
            <p className="text-3xl font-semibold text-white">{unreadNotificationCount}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
              Unread
            </p>
          </div>
        </div>
      </section>

      <NotificationPreferencePanel preferences={notificationPreferences} />

      <Card>
        <CardHeader className="border-b border-white/8 bg-white/[0.025]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-100" />
                In-app notifications
              </CardTitle>
              <CardDescription>
                Notifications are generated from meaningful activity events.
              </CardDescription>
            </div>
            {unreadNotificationCount ? (
              <form action={markAllNotificationsReadAction}>
                <Button type="submit" variant="secondary">
                  Mark all read
                </Button>
              </form>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {notifications.length ? (
            notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          ) : (
            <EmptyState
              title="No notifications yet"
              description="When a partner makes meaningful changes or a plan reaches a review moment, those updates will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
