import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db, subscription, plan } from "@acme/shared/server";
import { eq } from "drizzle-orm";
import { env } from "@/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Log the specific error details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Webhook processing failed",
        eventId: event.id,
        eventType: event.type,
      },
      { status: 500 },
    );
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  try {
    const customerId = sub.customer as string;
    const subscriptionId = sub.id;
    const priceId = sub.items.data[0]?.price.id;

    if (!priceId) {
      console.error("No price ID found in subscription:", subscriptionId);
      throw new Error("No price ID found in subscription");
    }

    // Get plan details
    const planDetails = await db
      .select()
      .from(plan)
      .where(eq(plan.stripePriceId, priceId))
      .limit(1);

    if (!planDetails[0]) {
      console.error(`Plan not found for price ID: ${priceId}`);
      throw new Error(`Plan not found for price ID: ${priceId}`);
    }

    // Get the reference ID from subscription metadata
    // The metadata should contain userId and organizationId from checkout session
    const metadata = sub.metadata;
    const userId = metadata?.userId;
    const organizationId = metadata?.organizationId;

    // Determine reference ID: organization subscription takes precedence
    const referenceId = organizationId || userId;

    if (!referenceId) {
      console.error("No reference ID found in subscription metadata:", {
        subscriptionId,
        metadata,
        customerId,
      });
      throw new Error("No reference ID found in subscription metadata");
    }

    // Upsert subscription
    await db
      .insert(subscription)
      .values({
        id: subscriptionId,
        plan: planDetails[0].id,
        referenceId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: sub.status,
        periodStart: new Date((sub as any).current_period_start * 1000),
        periodEnd: new Date((sub as any).current_period_end * 1000),
        trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        seats: sub.items.data[0]?.quantity || 1,
      })
      .onConflictDoUpdate({
        target: subscription.id,
        set: {
          plan: planDetails[0].id,
          status: sub.status,
          periodStart: new Date((sub as any).current_period_start * 1000),
          periodEnd: new Date((sub as any).current_period_end * 1000),
          trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          seats: sub.items.data[0]?.quantity || 1,
        },
      });

    console.log(
      `Successfully processed subscription change for ${subscriptionId}`,
    );
  } catch (error) {
    console.error("Error in handleSubscriptionChange:", error);
    throw error; // Re-throw to be caught by the main webhook handler
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  try {
    const subscriptionId = sub.id;

    await db
      .update(subscription)
      .set({
        status: "canceled",
      })
      .where(eq(subscription.stripeSubscriptionId, subscriptionId));

    console.log(
      `Successfully processed subscription deletion for ${subscriptionId}`,
    );
  } catch (error) {
    console.error("Error in handleSubscriptionDeleted:", error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (subscriptionId) {
      await db
        .update(subscription)
        .set({
          status: "active",
        })
        .where(eq(subscription.stripeSubscriptionId, subscriptionId));

      console.log(
        `Successfully processed payment success for subscription ${subscriptionId}`,
      );
    } else {
      console.log("No subscription ID found in payment succeeded event");
    }
  } catch (error) {
    console.error("Error in handlePaymentSucceeded:", error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (subscriptionId) {
      await db
        .update(subscription)
        .set({
          status: "past_due",
        })
        .where(eq(subscription.stripeSubscriptionId, subscriptionId));

      console.log(
        `Successfully processed payment failure for subscription ${subscriptionId}`,
      );
    } else {
      console.log("No subscription ID found in payment failed event");
    }
  } catch (error) {
    console.error("Error in handlePaymentFailed:", error);
    throw error;
  }
}
