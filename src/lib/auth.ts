import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import { env } from "@/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      membershipLimit: 100,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      async sendInvitationEmail(data) {
        console.log("Invitation email would be sent to:", data.email);
        console.log("Invitation link:", `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`);
        // TODO: Implement actual email sending logic
        // You can use services like Resend, SendGrid, etc.
      },
    }),
  ],
});
