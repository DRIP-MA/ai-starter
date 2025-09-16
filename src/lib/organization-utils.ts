import { db } from "@/lib/db";
import { organization, member } from "@/lib/db/schema";
import { generateId } from "better-auth";

export interface CreateDefaultOrganizationParams {
  userId: string;
  userName: string;
  userEmail: string;
}

/**
 * Creates a default organization for a new user
 */
export async function createDefaultOrganization({
  userId,
  userName,
  userEmail,
}: CreateDefaultOrganizationParams) {
  const orgName = `${userName}'s Organization`;
  const orgSlug = `${userName.toLowerCase().replace(/\s+/g, "-")}-org-${Date.now()}`;

  try {
    // Create the organization
    const [newOrg] = await db
      .insert(organization)
      .values({
        id: generateId(),
        name: orgName,
        slug: orgSlug,
        createdAt: new Date(),
        metadata: JSON.stringify({
          isDefault: true,
          createdBy: userId,
        }),
      })
      .returning();

    if (!newOrg) {
      throw new Error("Failed to create organization");
    }

    // Add the user as owner of the organization
    await db.insert(member).values({
      id: generateId(),
      userId,
      organizationId: newOrg.id,
      role: "owner",
      createdAt: new Date(),
    });

    console.log(`✅ Default organization created: ${orgName} (${newOrg.id})`);
    return newOrg;
  } catch (error) {
    console.error("❌ Failed to create default organization:", error);
    throw error;
  }
}

/**
 * Get subscription limits for an organization
 */
export async function getOrganizationLimits(organizationId: string) {
  try {
    // Get active subscription for the organization
    const activeSubscription = await db.query.subscription.findFirst({
      where: (subscription, { eq, and, or }) =>
        and(
          eq(subscription.referenceId, organizationId),
          eq(subscription.referenceType, "organization"),
          or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
          ),
        ),
      with: {
        plan: true,
      },
    });

    if (activeSubscription && activeSubscription.limits) {
      return JSON.parse(activeSubscription.limits);
    }

    // Return free tier limits if no subscription
    return {
      projects: 1,
      storage: 1, // GB
      members: 1,
      apiCalls: 1000,
    };
  } catch (error) {
    console.error("❌ Failed to get organization limits:", error);
    // Return minimal limits on error
    return {
      projects: 1,
      storage: 1,
      members: 1,
      apiCalls: 100,
    };
  }
}

/**
 * Check if organization has reached a specific limit
 */
export async function checkOrganizationLimit(
  organizationId: string,
  limitType: string,
  currentUsage: number,
): Promise<{ withinLimit: boolean; limit: number; usage: number }> {
  const limits = await getOrganizationLimits(organizationId);
  const limit = limits[limitType] || 0;

  // -1 means unlimited
  const withinLimit = limit === -1 || currentUsage < limit;

  return {
    withinLimit,
    limit,
    usage: currentUsage,
  };
}

/**
 * Get organization usage statistics
 */
export async function getOrganizationUsage(organizationId: string) {
  try {
    // You would implement these queries based on your actual data
    // This is a placeholder structure
    return {
      projects: 0, // Count of projects in organization
      storage: 0, // Storage used in GB
      members: 1, // Count of organization members
      apiCalls: 0, // API calls this month
    };
  } catch (error) {
    console.error("❌ Failed to get organization usage:", error);
    return {
      projects: 0,
      storage: 0,
      members: 0,
      apiCalls: 0,
    };
  }
}
