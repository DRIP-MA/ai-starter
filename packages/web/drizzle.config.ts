import { defineConfig } from "drizzle-kit";
import { env } from "@acme/shared/server";

export default defineConfig({
  schema: "../shared/src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
