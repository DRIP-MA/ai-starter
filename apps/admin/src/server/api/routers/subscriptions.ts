import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { db } from "@acme/shared/server";
import {
  subscription,
  plan,
  user,
  organization,
  member,
} from "@acme/shared/server";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

export const subscriptionsRouter = createTRPCRouter({
  getSubscriptions: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, organizationId } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = [];

      if (search) {
        whereConditions.push(
          or(
            like(user.name, `%${search}%`),
            like(user.email, `%${search}%`),
            like(plan.name, `%${search}%`),
          ),
        );
      }

      if (organizationId) {
        whereConditions.push(eq(subscription.referenceId, organizationId));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get subscriptions with related data
      const subscriptions = await db
        .select({
          id: subscription.id,
          plan: subscription.plan,
          referenceId: subscription.referenceId,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: subscription.status,
          periodStart: subscription.periodStart,
          periodEnd: subscription.periodEnd,
          trialStart: subscription.trialStart,
          trialEnd: subscription.trialEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          seats: subscription.seats,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
          organization: {
            id: organization.id,
            name: organization.name,
          },
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
        .leftJoin(user, eq(subscription.referenceId, user.id))
        .leftJoin(organization, eq(subscription.referenceId, organization.id))
        .leftJoin(plan, eq(subscription.plan, plan.id))
        .where(whereClause)
        .orderBy(desc(subscription.periodStart))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscription)
        .leftJoin(user, eq(subscription.referenceId, user.id))
        .leftJoin(organization, eq(subscription.referenceId, organization.id))
        .leftJoin(plan, eq(subscription.plan, plan.id))
        .where(whereClause);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        subscriptions,
        total,
        totalPages,
      };
    }),

  updateSubscription: adminProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        data: z.record(z.string(), z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionId, data } = input;

      // Update subscription in database
      await db
        .update(subscription)
        .set({
          ...data,
        })
        .where(eq(subscription.id, subscriptionId));

      return { success: true };
    }),

  getProducts: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = [eq(plan.isActive, true)];

      if (search) {
        whereConditions.push(like(plan.name, `%${search}%`));
      }

      const whereClause = and(...whereConditions);

      // Get plans
      const plans = await db
        .select()
        .from(plan)
        .where(whereClause)
        .orderBy(asc(plan.sortOrder))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(plan)
        .where(whereClause);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products: plans,
        total,
        totalPages,
      };
    }),

  getSubscribers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = [eq(subscription.status, "active")];

      if (search) {
        whereConditions.push(
          or(like(user.name, `%${search}%`), like(user.email, `%${search}%`))!,
        );
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get active subscribers
      const subscribers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          subscription: {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            periodStart: subscription.periodStart,
            periodEnd: subscription.periodEnd,
          },
          organization: {
            id: organization.id,
            name: organization.name,
          },
        })
        .from(subscription)
        .innerJoin(user, eq(subscription.referenceId, user.id))
        .leftJoin(organization, eq(subscription.referenceId, organization.id))
        .where(whereClause)
        .orderBy(desc(subscription.periodStart))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscription)
        .innerJoin(user, eq(subscription.referenceId, user.id))
        .where(whereClause);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        subscribers,
        total,
        totalPages,
      };
    }),

  // getListings removed - not part of our current project
});
