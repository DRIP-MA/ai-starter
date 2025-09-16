import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";

/**
 * Get all active subscription plans from database
 */
export async function getSubscriptionPlans() {
  try {
    const plans = await db.query.plan.findMany({
      where: (plan, { eq, and }) =>
        and(eq(plan.isActive, true), eq(plan.type, "subscription")),
      orderBy: (plan, { asc }) => asc(plan.sortOrder),
    });

    return plans.map((plan) => ({
      ...plan,
      limits: plan.limits ? JSON.parse(plan.limits) : {},
      features: plan.features ? JSON.parse(plan.features) : [],
      metadata: plan.metadata ? JSON.parse(plan.metadata) : {},
    }));
  } catch (error) {
    console.error("Failed to get subscription plans:", error);
    return [];
  }
}

export async function getOneTimePlans() {
  try {
    const plans = await db.query.plan.findMany({
      where: (plan, { eq, and }) =>
        and(eq(plan.isActive, true), eq(plan.type, "one_time")),
      orderBy: (plan, { asc }) => asc(plan.sortOrder),
    });

    return plans.map((plan) => ({
      ...plan,
      limits: plan.limits ? JSON.parse(plan.limits) : {},
      features: plan.features ? JSON.parse(plan.features) : [],
      metadata: plan.metadata ? JSON.parse(plan.metadata) : {},
    }));
  } catch (error) {
    console.error("Failed to get one-time plans:", error);
    return [];
  }
}

/**
 * Get a specific plan by name
 */
export async function getPlanByName(name: string) {
  try {
    const plan = await db.query.plan.findFirst({
      where: (plan, { eq, and }) =>
        and(eq(plan.name, name), eq(plan.isActive, true)),
    });

    if (!plan) return null;

    return {
      ...plan,
      limits: plan.limits ? JSON.parse(plan.limits) : {},
      features: plan.features ? JSON.parse(plan.features) : [],
      metadata: plan.metadata ? JSON.parse(plan.metadata) : {},
    };
  } catch (error) {
    console.error(`Failed to get plan ${name}:`, error);
    return null;
  }
}

/**
 * Get organization's active subscription with plan details
 */
export async function getOrganizationSubscription(organizationId: string) {
  try {
    const subscription = await db.query.subscription.findFirst({
      where: (sub, { eq, and, or }) =>
        and(
          eq(sub.referenceId, organizationId),
          eq(sub.referenceType, "organization"),
          or(eq(sub.status, "active"), eq(sub.status, "trialing")),
        ),
    });

    if (!subscription) return null;

    // Get the plan details
    const plan = await getPlanByName(subscription.planName);

    return {
      ...subscription,
      plan,
      limits: subscription.limits ? JSON.parse(subscription.limits) : {},
      metadata: subscription.metadata ? JSON.parse(subscription.metadata) : {},
    };
  } catch (error) {
    console.error("Failed to get organization subscription:", error);
    return null;
  }
}

/**
 * Check if user can create organization based on their subscription
 */
export async function canUserCreateOrganization(
  userId: string,
): Promise<boolean> {
  try {
    // Get user's organizations count
    const userOrganizations = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.userId, userId),
    });

    // Check if user has any active subscriptions that allow multiple organizations
    for (const membership of userOrganizations) {
      const subscription = await getOrganizationSubscription(
        membership.organizationId,
      );
      if (subscription?.plan?.limits?.organizations === -1) {
        return true; // Unlimited organizations
      }
    }

    // Free tier: limit to 1 organization
    return userOrganizations.length < 1;
  } catch (error) {
    console.error("Failed to check organization creation permission:", error);
    return false;
  }
}
