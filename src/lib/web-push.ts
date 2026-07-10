import webPush, { WebPushError, type PushSubscription as WebPushPayload } from "web-push";

import { prisma } from "@/lib/prisma";

type PushNotificationRecord = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  targetHref: string | null;
};

type PushSubscriptionRecord = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function getVapidDetails() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:lifegrid@example.com";

  if (!publicKey || !privateKey) {
    return null;
  }

  return {
    subject,
    publicKey,
    privateKey
  };
}

export function isWebPushConfigured() {
  return Boolean(getVapidDetails());
}

function toWebPushPayload(subscription: PushSubscriptionRecord): WebPushPayload {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };
}

function getNotificationPayload(notification: PushNotificationRecord) {
  return JSON.stringify({
    title: notification.title,
    body: notification.message,
    url: notification.targetHref || "/notifications",
    notificationId: notification.id,
    type: notification.type
  });
}

function isStaleSubscriptionError(error: unknown) {
  return error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410);
}

async function sendPushToSubscription({
  notification,
  subscription,
  vapidDetails
}: {
  notification: PushNotificationRecord;
  subscription: PushSubscriptionRecord;
  vapidDetails: NonNullable<ReturnType<typeof getVapidDetails>>;
}) {
  await webPush.sendNotification(
    toWebPushPayload(subscription),
    getNotificationPayload(notification),
    {
      vapidDetails,
      TTL: 60 * 60 * 24,
      urgency: "normal",
      timeout: 5000
    }
  );
}

export function schedulePushDeliveryForActivityEvent(activityEventId: string) {
  if (!isWebPushConfigured()) {
    return;
  }

  setTimeout(() => {
    deliverPushNotificationsForActivityEvent(activityEventId).catch((error: unknown) => {
      console.warn("LifeGrid push delivery failed.", error instanceof Error ? error.message : error);
    });
  }, 0);
}

export async function deliverPushNotificationsForActivityEvent(activityEventId: string) {
  const vapidDetails = getVapidDetails();

  if (!vapidDetails) {
    return;
  }

  const notifications = await prisma.notification.findMany({
    where: {
      activityEventId
    },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      targetHref: true
    }
  });

  if (!notifications.length) {
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId: {
        in: [...new Set(notifications.map((notification) => notification.userId))]
      },
      disabledAt: null
    },
    select: {
      id: true,
      userId: true,
      endpoint: true,
      p256dh: true,
      auth: true
    }
  });

  if (!subscriptions.length) {
    return;
  }

  const subscriptionsByUserId = subscriptions.reduce(
    (map, subscription) => {
      const userSubscriptions = map.get(subscription.userId) ?? [];
      userSubscriptions.push(subscription);
      map.set(subscription.userId, userSubscriptions);
      return map;
    },
    new Map<string, PushSubscriptionRecord[]>()
  );
  const successfulNotificationIds = new Set<string>();
  const successfulSubscriptionIds = new Set<string>();
  const staleSubscriptionIds = new Set<string>();

  await Promise.all(
    notifications.flatMap((notification) =>
      (subscriptionsByUserId.get(notification.userId) ?? []).map(async (subscription) => {
        try {
          await sendPushToSubscription({
            notification,
            subscription,
            vapidDetails
          });
          successfulNotificationIds.add(notification.id);
          successfulSubscriptionIds.add(subscription.id);
        } catch (error) {
          if (isStaleSubscriptionError(error)) {
            staleSubscriptionIds.add(subscription.id);
            return;
          }

          console.warn(
            "LifeGrid push notification could not be delivered.",
            error instanceof WebPushError ? `status ${error.statusCode}` : ""
          );
        }
      })
    )
  );

  await Promise.all([
    successfulNotificationIds.size
      ? prisma.notification.updateMany({
          where: {
            id: {
              in: [...successfulNotificationIds]
            }
          },
          data: {
            deliveryStatus: "in_app_push",
            deliveryChannels: ["in_app", "push"]
          }
        })
      : Promise.resolve(),
    successfulSubscriptionIds.size
      ? prisma.pushSubscription.updateMany({
          where: {
            id: {
              in: [...successfulSubscriptionIds]
            }
          },
          data: {
            lastSeenAt: new Date()
          }
        })
      : Promise.resolve(),
    staleSubscriptionIds.size
      ? prisma.pushSubscription.updateMany({
          where: {
            id: {
              in: [...staleSubscriptionIds]
            }
          },
          data: {
            disabledAt: new Date()
          }
        })
      : Promise.resolve()
  ]);
}
