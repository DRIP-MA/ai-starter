// Client-side exports
export { authClient } from "./auth/auth-client";
export { cn } from "./lib/utils";

// Server-side exports (use dynamic imports or separate entry points)
export { auth } from "./auth/auth";
export { db } from "./db";
export * from "./db/schema";
export { env } from "./env";
export { emailService } from "./lib/email";
