import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { user, organization } from "@acme/shared/server";
import { count, desc, sql, like, and, eq } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  getAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["today", "7d", "30d", "90d", "1y", "all"]),
      })
    )
    .query(async ({ ctx, input }) => {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Get total counts
      const [totalUsers] = await ctx.db
        .select({ count: count() })
        .from(user)
        .where(input.period === "all" ? undefined : sql`${user.createdAt} >= ${startDate}`);

      const [totalOrganizations] = await ctx.db
        .select({ count: count() })
        .from(organization)
        .where(input.period === "all" ? undefined : sql`${organization.createdAt} >= ${startDate}`);

      // Mock subscriber count for now (you can add a subscription table later)
      const totalSubscribers = Math.floor((totalUsers?.count || 0) * 0.25);

      return {
        summary: {
          totalUsers: totalUsers?.count || 0,
          totalOrganizations: totalOrganizations?.count || 0,
          totalSubscribers,
        },
        // TODO: Add time series data
        usersOverTime: [],
        subscribersOverTime: [],
        cumulativeUsersOverTime: [],
        cumulativeSubscribersOverTime: [],
      };
    }),

  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        organizationId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      
      let whereCondition;
      if (input.search) {
        whereCondition = and(
          like(user.name, `%${input.search}%`),
          // Add organization filter if provided
          input.organizationId ? eq(user.id, input.organizationId) : undefined
        );
      } else if (input.organizationId) {
        whereCondition = eq(user.id, input.organizationId);
      }

      const users = await ctx.db
        .select()
        .from(user)
        .where(whereCondition)
        .limit(input.limit)
        .offset(offset)
        .orderBy(desc(user.createdAt));

      const [totalCount] = await ctx.db
        .select({ count: count() })
        .from(user)
        .where(whereCondition);

      return {
        users,
        total: totalCount?.count || 0,
        totalPages: Math.ceil((totalCount?.count || 0) / input.limit),
      };
    }),

  getOrganizations: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      
      const whereCondition = input.search
        ? like(organization.name, `%${input.search}%`)
        : undefined;

      const organizations = await ctx.db
        .select()
        .from(organization)
        .where(whereCondition)
        .limit(input.limit)
        .offset(offset)
        .orderBy(desc(organization.createdAt));

      const [totalCount] = await ctx.db
        .select({ count: count() })
        .from(organization)
        .where(whereCondition);

      return {
        organizations,
        total: totalCount?.count || 0,
        totalPages: Math.ceil((totalCount?.count || 0) / input.limit),
      };
    }),

  getSubscriptions: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      // Mock implementation - replace with actual subscription table queries
      return {
        subscriptions: [],
        total: 0,
        totalPages: 1,
      };
    }),

  updateOrganizationCredits: adminProcedure
    .input(
      z.object({
        organizationId: z.string(),
        credits: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement credit system
      // For now, just return success
      return { success: true };
    }),

  updateSubscription: adminProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        data: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement subscription updates
      // For now, just return success
      return { success: true };
    }),
});
