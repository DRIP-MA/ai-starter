import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  db,
  subscription,
  plan,
  organization,
  member,
  user,
} from "@acme/shared/server";
import { eq, and, desc } from "drizzle-orm";
import Stripe from "stripe";
import { env } from "@/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export const subscriptionRouter = createTRPCRouter({
  // Get current user's subscription
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userSubscription = await db
      .select({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        seats: subscription.seats,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        planDetails: {
          id: plan.id,
          name: plan.name,
          stripePriceId: plan.stripePriceId,
          stripeAnnualPriceId: plan.stripeAnnualPriceId,
          type: plan.type,
          limits: plan.limits,
          trialPeriodDays: plan.trialPeriodDays,
        },
      })
      .from(subscription)
      .leftJoin(plan, eq(subscription.plan, plan.id))
      .where(eq(subscription.referenceId, userId))
      .orderBy(desc(subscription.periodStart))
      .limit(1);

    return userSubscription[0] || null;
  }),

  // Get organization's subscription
  getOrganizationSubscription: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { organizationId } = input;

      // Check if user is member of organization
      const membership = await db
        .select()
        .from(member)
        .where(
          and(
            eq(member.organizationId, organizationId),
            eq(member.userId, userId),
          ),
        )
        .limit(1);

      if (!membership[0]) {
        throw new Error("Not authorized to view organization subscription");
      }

      const orgSubscription = await db
        .select({
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          periodStart: subscription.periodStart,
          periodEnd: subscription.periodEnd,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          seats: subscription.seats,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          planDetails: {
            id: plan.id,
            name: plan.name,
            stripePriceId: plan.stripePriceId,
            stripeAnnualPriceId: plan.stripeAnnualPriceId,
            type: plan.type,
            limits: plan.limits,
            trialPeriodDays: plan.trialPeriodDays,
          },
        })
        .from(subscription)
        .leftJoin(plan, eq(subscription.plan, plan.id))
        .where(eq(subscription.referenceId, organizationId))
        .orderBy(desc(subscription.periodStart))
        .limit(1);

      return orgSubscription[0] || null;
    }),

  // Get available plans
  getPlans: protectedProcedure.query(async () => {
    const plans = await db
      .select()
      .from(plan)
      .where(eq(plan.isActive, true))
      .orderBy(plan.sortOrder);

    return plans;
  }),

  // Create checkout session for subscription
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        organizationId: z.string().optional(),
        successUrl: z.string().optional(),
        cancelUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { priceId, organizationId, successUrl, cancelUrl } = input;

      // Get user's Stripe customer ID
      const userData = await db
        .select({
          stripeCustomerId: user.stripeCustomerId,
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userData[0]) {
        throw new Error("User not found");
      }

      let stripeCustomerId = userData[0].stripeCustomerId;

      // Create Stripe customer if one doesn't exist
      if (!stripeCustomerId) {
        try {
          const customer = await stripe.customers.create({
            email: userData[0].email,
            name: userData[0].name || undefined,
            metadata: {
              userId,
            },
          });

          stripeCustomerId = customer.id;

          // Update user record with Stripe customer ID
          await db
            .update(user)
            .set({ stripeCustomerId: customer.id })
            .where(eq(user.id, userId));
        } catch (error) {
          console.error("Failed to create Stripe customer:", error);
          throw new Error("Failed to create customer account");
        }
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url:
          successUrl || `${env.BETTER_AUTH_URL}/dashboard?success=true`,
        cancel_url:
          cancelUrl || `${env.BETTER_AUTH_URL}/dashboard?canceled=true`,
        subscription_data: {
          metadata: {
            userId,
            organizationId: organizationId || "",
          },
        },
      });

      if (!session.url) {
        throw new Error("Failed to create checkout session URL");
      }

      return { sessionId: session.id, url: session.url };
    }),

  // Create customer portal session
  createCustomerPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { returnUrl } = input;

      // Get user's Stripe customer ID
      const userData = await db
        .select({
          stripeCustomerId: user.stripeCustomerId,
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userData[0]) {
        throw new Error("User not found");
      }

      let stripeCustomerId = userData[0].stripeCustomerId;

      // Create Stripe customer if one doesn't exist
      if (!stripeCustomerId) {
        try {
          const customer = await stripe.customers.create({
            email: userData[0].email,
            name: userData[0].name || undefined,
            metadata: {
              userId,
            },
          });

          stripeCustomerId = customer.id;

          // Update user record with Stripe customer ID
          await db
            .update(user)
            .set({ stripeCustomerId: customer.id })
            .where(eq(user.id, userId));
        } catch (error) {
          console.error("Failed to create Stripe customer:", error);
          throw new Error("Failed to create customer account");
        }
      }

      // Create customer portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl || `${env.BETTER_AUTH_URL}/dashboard`,
      });

      if (!session.url) {
        throw new Error("Failed to create customer portal session URL");
      }

      return { url: session.url };
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const { subscriptionId, organizationId } = input;

        // Verify user has access to this subscription
        const userSubscription = await db
          .select()
          .from(subscription)
          .where(
            and(
              eq(subscription.id, subscriptionId),
              eq(subscription.referenceId, organizationId || userId),
            ),
          )
          .limit(1);

        if (!userSubscription[0]) {
          throw new Error("Subscription not found or not authorized");
        }

        // Cancel subscription in Stripe
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

        // Update database
        await db
          .update(subscription)
          .set({
            cancelAtPeriodEnd: true,
          })
          .where(eq(subscription.id, subscriptionId));

        return { success: true };
      } catch (error) {
        console.error("Error canceling subscription:", error);
        if (error instanceof Error) {
          throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
        throw new Error("Failed to cancel subscription");
      }
    }),

  // Reactivate subscription
  reactivateSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const { subscriptionId, organizationId } = input;

        // Verify user has access to this subscription
        const userSubscription = await db
          .select()
          .from(subscription)
          .where(
            and(
              eq(subscription.id, subscriptionId),
              eq(subscription.referenceId, organizationId || userId),
            ),
          )
          .limit(1);

        if (!userSubscription[0]) {
          throw new Error("Subscription not found or not authorized");
        }

        // Reactivate subscription in Stripe
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });

        // Update database
        await db
          .update(subscription)
          .set({
            cancelAtPeriodEnd: false,
          })
          .where(eq(subscription.id, subscriptionId));

        return { success: true };
      } catch (error) {
        console.error("Error reactivating subscription:", error);
        if (error instanceof Error) {
          throw new Error(
            `Failed to reactivate subscription: ${error.message}`,
          );
        }
        throw new Error("Failed to reactivate subscription");
      }
    }),
});
