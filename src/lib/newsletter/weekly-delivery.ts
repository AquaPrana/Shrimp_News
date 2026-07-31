import "server-only";

import type { NewsletterDelivery, Subscriber } from "@prisma/client";
import {
  NewsletterDeliveryError,
  sendWeeklyNewsletter,
} from "@/lib/newsletter/email-service";
import { previousSevenDays, newsletterWeekKey } from "@/lib/newsletter/schedule";
import type { NewsletterArticle } from "@/lib/newsletter/templates";
import { ensureSubscriberToken } from "@/lib/newsletter/subscriber-token";
import { logDatabaseError, prisma, prismaErrorCode } from "@/lib/prisma";

const DELIVERY_BATCH_SIZE = 5;
const DELIVERY_BATCH_PAUSE_MS = 1_050;
const STALE_PROCESSING_MS = 20 * 60_000;

type DeliveryClaim =
  | { kind: "claimed"; delivery: NewsletterDelivery }
  | { kind: "skipped" };

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeFailure(error: unknown) {
  if (error instanceof NewsletterDeliveryError) return error.safeMessage.slice(0, 500);
  return "delivery_failed";
}

async function claimExisting(delivery: NewsletterDelivery): Promise<DeliveryClaim> {
  if (delivery.status === "sent") return { kind: "skipped" };

  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const canRetry =
    delivery.status === "failed" ||
    (delivery.status === "processing" && delivery.updatedAt <= staleBefore);
  if (!canRetry) return { kind: "skipped" };

  const claimed = await prisma.newsletterDelivery.updateMany({
    where: {
      id: delivery.id,
      status: delivery.status,
      updatedAt: delivery.updatedAt,
    },
    data: {
      status: "processing",
      sentAt: null,
      errorMessage: null,
    },
  });
  if (claimed.count === 0) return { kind: "skipped" };

  return {
    kind: "claimed",
    delivery: await prisma.newsletterDelivery.findUniqueOrThrow({
      where: { id: delivery.id },
    }),
  };
}

async function claimDelivery(subscriberId: string, newsletterWeek: string) {
  const key = {
    subscriberId_newsletterWeek: { subscriberId, newsletterWeek },
  };
  const existing = await prisma.newsletterDelivery.findUnique({ where: key });
  if (existing) return claimExisting(existing);

  try {
    return {
      kind: "claimed" as const,
      delivery: await prisma.newsletterDelivery.create({
        data: { subscriberId, newsletterWeek, status: "processing" },
      }),
    };
  } catch (error) {
    if (prismaErrorCode(error) !== "P2002") throw error;
    const raced = await prisma.newsletterDelivery.findUniqueOrThrow({ where: key });
    return claimExisting(raced);
  }
}

async function deliverToSubscriber(
  subscriberSnapshot: Subscriber,
  week: string,
  articles: NewsletterArticle[],
) {
  const subscriber = await prisma.subscriber.findFirst({
    where: { id: subscriberSnapshot.id, isActive: true },
  });
  if (!subscriber) return "skipped" as const;

  const claim = await claimDelivery(subscriber.id, week);
  if (claim.kind === "skipped") return "skipped" as const;

  try {
    const subscriberWithToken = await ensureSubscriberToken(subscriber);
    await sendWeeklyNewsletter({
      subscriberId: subscriberWithToken.id,
      email: subscriberWithToken.email,
      unsubscribeToken: subscriberWithToken.unsubscribeToken,
      newsletterWeek: week,
      articles,
    });

    const sentAt = new Date();
    await prisma.$transaction([
      prisma.newsletterDelivery.update({
        where: { id: claim.delivery.id },
        data: {
          status: "sent",
          sentAt,
          errorMessage: null,
        },
      }),
      prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { lastNewsletterSentAt: sentAt },
      }),
    ]);
    return "sent" as const;
  } catch (error) {
    const failure = safeFailure(error);
    console.error("[newsletter:weekly-delivery]", {
      deliveryId: claim.delivery.id,
      error: failure,
    });
    try {
      await prisma.newsletterDelivery.update({
        where: { id: claim.delivery.id },
        data: {
          status: "failed",
          errorMessage: failure,
          sentAt: null,
        },
      });
    } catch (trackingError) {
      logDatabaseError("newsletter.delivery-failure-tracking", trackingError);
    }
    return "failed" as const;
  }
}

export async function runWeeklyNewsletter(now = new Date()) {
  const window = previousSevenDays(now);
  const rows = await prisma.article.findMany({
    where: {
      isPublished: true,
      language: "en",
      createdAt: {
        gte: window.from,
        lt: window.to,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      slug: true,
      category: true,
      createdAt: true,
      excerpt: true,
      imageUrl: true,
    },
  });

  if (rows.length === 0) {
    return {
      success: true as const,
      message: "No new articles found for this week.",
      articles: 0,
      totalActiveSubscribers: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };
  }

  const articles: NewsletterArticle[] = rows.map((article) => ({
    title: article.title,
    slug: article.slug,
    category: article.category,
    publishedAt: article.createdAt,
    description: article.excerpt,
    imageUrl: article.imageUrl,
  }));
  const subscribers = await prisma.subscriber.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });
  const week = newsletterWeekKey(now);
  const totals = { sent: 0, failed: 0, skipped: 0 };

  for (let index = 0; index < subscribers.length; index += DELIVERY_BATCH_SIZE) {
    const batch = subscribers.slice(index, index + DELIVERY_BATCH_SIZE);
    const results = await Promise.all(
      batch.map((subscriber) => deliverToSubscriber(subscriber, week, articles)),
    );
    for (const result of results) totals[result] += 1;
    if (index + DELIVERY_BATCH_SIZE < subscribers.length) {
      await pause(DELIVERY_BATCH_PAUSE_MS);
    }
  }

  return {
    success: true as const,
    articles: articles.length,
    totalActiveSubscribers: subscribers.length,
    ...totals,
  };
}
