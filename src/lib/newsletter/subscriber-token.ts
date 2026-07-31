import "server-only";

import type { Subscriber } from "@prisma/client";
import { createUnsubscribeToken } from "@/lib/newsletter/tokens";
import { prisma, prismaErrorCode } from "@/lib/prisma";

export type SubscriberWithToken = Subscriber & { unsubscribeToken: string };

export async function ensureSubscriberToken(
  subscriber: Subscriber,
): Promise<SubscriberWithToken> {
  if (subscriber.unsubscribeToken) {
    return subscriber as SubscriberWithToken;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const updated = await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { unsubscribeToken: createUnsubscribeToken() },
      });
      if (updated.unsubscribeToken) return updated as SubscriberWithToken;
    } catch (error) {
      if (prismaErrorCode(error) !== "P2002") throw error;
    }
  }

  throw new Error("Unable to generate a unique unsubscribe token.");
}
