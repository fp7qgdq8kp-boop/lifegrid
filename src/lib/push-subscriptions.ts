import { z } from "zod";

import { prisma } from "@/lib/prisma";

const pushSubscriptionKeysSchema = z.object({
  p256dh: z.string().trim().min(1).max(512),
  auth: z.string().trim().min(1).max(512)
});

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().trim().url().max(4096),
  expirationTime: z.number().finite().nullable().optional(),
  keys: pushSubscriptionKeysSchema,
  userAgent: z.string().trim().max(500).optional()
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

function toExpirationDate(expirationTime?: number | null) {
  if (!expirationTime) {
    return null;
  }

  const expirationDate = new Date(expirationTime);
  return Number.isNaN(expirationDate.getTime()) ? null : expirationDate;
}

export async function savePushSubscription({
  householdId,
  userId,
  input
}: {
  householdId: string;
  userId: string;
  input: PushSubscriptionInput;
}) {
  const now = new Date();
  const subscription = pushSubscriptionInputSchema.parse(input);

  return prisma.pushSubscription.upsert({
    where: {
      endpoint: subscription.endpoint
    },
    update: {
      householdId,
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: toExpirationDate(subscription.expirationTime),
      userAgent: subscription.userAgent || null,
      disabledAt: null,
      lastSeenAt: now
    },
    create: {
      householdId,
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: toExpirationDate(subscription.expirationTime),
      userAgent: subscription.userAgent || null,
      lastSeenAt: now
    }
  });
}

export async function disablePushSubscription({
  householdId,
  userId,
  endpoint
}: {
  householdId: string;
  userId: string;
  endpoint: string;
}) {
  const parsedEndpoint = z.string().trim().url().max(4096).parse(endpoint);

  return prisma.pushSubscription.updateMany({
    where: {
      householdId,
      userId,
      endpoint: parsedEndpoint,
      disabledAt: null
    },
    data: {
      disabledAt: new Date()
    }
  });
}
