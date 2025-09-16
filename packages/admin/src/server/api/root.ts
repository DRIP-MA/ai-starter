import { adminRouter } from "@/server/api/routers/admin";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for the admin server.
 *
 * All routers added in /src/server/api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
