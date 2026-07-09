import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { HouseholdMemberRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { disablePushSubscription, savePushSubscription } from "@/lib/push-subscriptions";

const databaseUrl = process.env.DATABASE_URL;
const integrationTest = databaseUrl ? test : test.skip;

async function createFixture() {
  const suffix = randomUUID();
  const user = await prisma.user.create({
    data: {
      name: "Push Subscriber",
      email: `push-${suffix}@lifegrid.test`
    }
  });

  const household = await prisma.household.create({
    data: {
      name: `Push Test ${suffix}`,
      createdByUserId: user.id,
      members: {
        create: {
          userId: user.id,
          role: HouseholdMemberRole.OWNER
        }
      }
    }
  });

  return { household, user };
}

async function cleanupFixture(fixture: Awaited<ReturnType<typeof createFixture>>) {
  await prisma.household.delete({
    where: { id: fixture.household.id }
  });

  await prisma.user.delete({
    where: { id: fixture.user.id }
  });
}

integrationTest("push subscriptions can be saved, refreshed, and disabled", async () => {
  const fixture = await createFixture();
  const endpoint = `https://updates.push.services.mozilla.com/wpush/v2/${randomUUID()}`;

  try {
    const savedSubscription = await savePushSubscription({
      householdId: fixture.household.id,
      userId: fixture.user.id,
      input: {
        endpoint,
        expirationTime: Date.UTC(2027, 0, 1),
        keys: {
          p256dh: "first-public-key",
          auth: "first-auth-secret"
        },
        userAgent: "LifeGrid test browser"
      }
    });

    assert.equal(savedSubscription.householdId, fixture.household.id);
    assert.equal(savedSubscription.userId, fixture.user.id);
    assert.equal(savedSubscription.endpoint, endpoint);
    assert.equal(savedSubscription.disabledAt, null);
    assert.equal(savedSubscription.expirationTime?.toISOString(), "2027-01-01T00:00:00.000Z");

    await disablePushSubscription({
      householdId: fixture.household.id,
      userId: fixture.user.id,
      endpoint
    });

    const disabledSubscription = await prisma.pushSubscription.findUniqueOrThrow({
      where: { endpoint }
    });

    assert.ok(disabledSubscription.disabledAt);

    const refreshedSubscription = await savePushSubscription({
      householdId: fixture.household.id,
      userId: fixture.user.id,
      input: {
        endpoint,
        expirationTime: null,
        keys: {
          p256dh: "updated-public-key",
          auth: "updated-auth-secret"
        }
      }
    });

    assert.equal(refreshedSubscription.id, savedSubscription.id);
    assert.equal(refreshedSubscription.p256dh, "updated-public-key");
    assert.equal(refreshedSubscription.auth, "updated-auth-secret");
    assert.equal(refreshedSubscription.expirationTime, null);
    assert.equal(refreshedSubscription.userAgent, null);
    assert.equal(refreshedSubscription.disabledAt, null);
    assert.ok(refreshedSubscription.lastSeenAt >= savedSubscription.lastSeenAt);
  } finally {
    await cleanupFixture(fixture);
  }
});
