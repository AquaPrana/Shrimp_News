import "server-only";

import type { Subscriber } from "@prisma/client";
import { createUnsubscribeToken } from "@/lib/newsletter/tokens";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";

export type SubscriptionResult =
  | {
      kind: "subscribed";
      status: 201;
      message: "Thank you for subscribing to Shrimp.News.";
    }
  | {
      kind: "already_subscribed";
      status: 200;
      message: "You're already subscribed to Shrimp.News.";
    };

async function createSubscriber(email: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.subscriber.create({
        data: {
          email,
          isActive: true,
          subscribedAt: new Date(),
          unsubscribeToken: createUnsubscribeToken(),
        },
      });
    } catch (error) {
      if (prismaErrorCode(error) !== "P2002") throw error;
      const existing = await prisma.subscriber.findUnique({ where: { email } });
      if (existing) return existing;
    }
  }
  throw new Error("Unable to allocate a unique unsubscribe token.");
}

async function reactivateSubscriber(existing: Subscriber) {
  const now = new Date();
  const update = await prisma.subscriber.updateMany({
    where: { id: existing.id, isActive: false },
    data: {
      isActive: true,
      subscribedAt: now,
      unsubscribeToken: createUnsubscribeToken(),
    },
  });

  if (update.count === 0) {
    return prisma.subscriber.findUniqueOrThrow({ where: { id: existing.id } });
  }
  return prisma.subscriber.findUniqueOrThrow({ where: { id: existing.id } });
}

/**
 * Save the subscriber to MySQL only.
 * Welcome emails / weekly newsletters are intentionally disabled for now.
 */
export async function subscribeEmail(email: string): Promise<SubscriptionResult> {
  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing?.isActive) {
      return {
        kind: "already_subscribed",
        status: 200,
        message: "You're already subscribed to Shrimp.News.",
      };
    }

    if (existing) {
      const reactivated = await reactivateSubscriber(existing);
      if (!reactivated.isActive) {
        // Another concurrent request may have already reactivated it.
        return {
          kind: "already_subscribed",
          status: 200,
          message: "You're already subscribed to Shrimp.News.",
        };
      }
      return {
        kind: "subscribed",
        status: 201,
        message: "Thank you for subscribing to Shrimp.News.",
      };
    }

    const created = await createSubscriber(email);
    if (created.isActive) {
      return {
        kind: "subscribed",
        status: 201,
        message: "Thank you for subscribing to Shrimp.News.",
      };
    }

    // Unique-constraint race returned an already-active row.
    return {
      kind: "already_subscribed",
      status: 200,
      message: "You're already subscribed to Shrimp.News.",
    };
  } catch (error) {
    logDatabaseError("newsletter.subscribe", error);
    throw error;
  }
}
