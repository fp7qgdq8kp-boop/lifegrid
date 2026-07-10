"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BellRing, BellOff, CheckCircle2, Smartphone } from "lucide-react";

import {
  removePushSubscriptionAction,
  savePushSubscriptionAction
} from "@/actions/lifegrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BrowserPermission = NotificationPermission | "unsupported";
type SupportState = "checking" | "not_configured" | "unsupported" | "supported";

function base64UrlToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return (
    navigatorWithStandalone.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function getSupportState(publicKey: string | null) {
  if (!publicKey) {
    return "not_configured" as const;
  }

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported" as const;
  }

  return "supported" as const;
}

function getSubscriptionPayload(subscription: PushSubscription) {
  const payload = subscription.toJSON();
  const endpoint = payload.endpoint ?? subscription.endpoint;
  const p256dh = payload.keys?.p256dh;
  const auth = payload.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("This browser returned an incomplete push subscription.");
  }

  return {
    endpoint,
    expirationTime: payload.expirationTime ?? null,
    keys: {
      p256dh,
      auth
    },
    userAgent: navigator.userAgent
  };
}

export function PushNotificationPanel({
  publicKey,
  activeSubscriptionCount
}: {
  publicKey: string | null;
  activeSubscriptionCount: number;
}) {
  const [permission, setPermission] = useState<BrowserPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supportState: SupportState = useMemo(() => {
    if (!hasMounted) {
      return "checking";
    }

    return getSupportState(publicKey);
  }, [hasMounted, publicKey]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (supportState === "checking") {
      return;
    }

    if (supportState !== "supported") {
      setPermission(supportState === "unsupported" ? "unsupported" : "default");
      return;
    }

    setPermission(Notification.permission);
    setIsStandalone(isStandaloneDisplay());

    let isMounted = true;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (isMounted) {
          setIsSubscribed(Boolean(subscription));
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage("LifeGrid could not read this device's notification status yet.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [supportState]);

  const statusBadge = (() => {
    if (isSubscribed) {
      return <Badge variant="success">Enabled here</Badge>;
    }

    if (permission === "denied") {
      return <Badge variant="danger">Blocked</Badge>;
    }

    if (supportState === "checking") {
      return <Badge>Checking</Badge>;
    }

    if (supportState === "not_configured") {
      return <Badge variant="warning">Setup needed</Badge>;
    }

    if (supportState === "unsupported") {
      return <Badge variant="warning">Unsupported</Badge>;
    }

    return <Badge variant="accent">Ready</Badge>;
  })();

  const enableNotifications = () => {
    startTransition(async () => {
      setMessage(null);

      if (!publicKey || supportState !== "supported") {
        setMessage("Push notifications are not ready on this device yet.");
        return;
      }

      try {
        const requestedPermission = await Notification.requestPermission();
        setPermission(requestedPermission);

        if (requestedPermission !== "granted") {
          setMessage("Notifications were not enabled. You can allow them from browser settings.");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        const subscription =
          existingSubscription ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(publicKey)
          }));
        const result = await savePushSubscriptionAction(getSubscriptionPayload(subscription));

        if (!result.ok) {
          setMessage(result.message ?? "LifeGrid could not save this device.");
          return;
        }

        setIsSubscribed(true);
        setMessage("Notifications are enabled on this device.");
      } catch {
        setMessage("LifeGrid could not enable notifications on this device.");
      }
    });
  };

  const disableNotifications = () => {
    startTransition(async () => {
      setMessage(null);

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        const endpoint = subscription?.endpoint;

        if (subscription) {
          await subscription.unsubscribe();
        }

        if (endpoint) {
          const result = await removePushSubscriptionAction(endpoint);

          if (!result.ok) {
            setMessage(result.message ?? "LifeGrid could not remove this device.");
            return;
          }
        }

        setIsSubscribed(false);
        setMessage("Notifications are off for this device.");
      } catch {
        setMessage("LifeGrid could not turn off notifications on this device.");
      }
    });
  };

  return (
    <Card className="overflow-hidden border-cyan-300/10">
      <CardHeader className="border-b border-white/8 bg-cyan-400/[0.035]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-cyan-100" />
              iPhone notifications
            </CardTitle>
            <CardDescription>
              Enable alerts for this device when LifeGrid has something worth your attention.
            </CardDescription>
          </div>
          {statusBadge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-100" />
            <div className="space-y-2 text-sm leading-6 text-slate-300/80">
              <p>
                On iPhone, add LifeGrid to your Home Screen first. Then open that Home Screen app
                and tap the button below.
              </p>
              <p>
                Saved devices for this account:{" "}
                <span className="font-semibold text-white">{activeSubscriptionCount}</span>
              </p>
              {!isStandalone ? (
                <p className="text-cyan-100/80">
                  Tip: Safari supports Home Screen web app notifications. Browser tabs may not show
                  the same behavior.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {message ? (
          <p className="rounded-2xl border border-white/8 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
            {message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={enableNotifications}
            disabled={
              isPending ||
              isSubscribed ||
              permission === "denied" ||
              supportState !== "supported"
            }
          >
            <BellRing className="h-4 w-4" />
            {isSubscribed ? "Enabled on this device" : "Enable notifications"}
          </Button>
          {isSubscribed ? (
            <Button
              type="button"
              variant="outline"
              onClick={disableNotifications}
              disabled={isPending}
            >
              <BellOff className="h-4 w-4" />
              Turn off this device
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
