import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { db } from "@/lib/db";
import { env } from "@/env";
import { emailService } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await emailService.sendPasswordReset({
        to: user.email,
        firstName: user.name || "User",
        resetLink: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendEmailVerification({
        to: user.email,
        firstName: user.name || "User",
        verificationLink: url,
      });
    },
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
        const inviteLink = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        await emailService.sendOrganizationInvitation({
          to: data.email,
          invitedByName: data.inviter.user.name || "Team Member",
          invitedByEmail: data.inviter.user.email,
          organizationName: data.organization.name,
          role: Array.isArray(data.role) ? data.role.join(", ") : data.role,
          inviteLink,
        });
      },
      organizationHooks: {
        afterCreateOrganization: async ({
          organization,
          user,
        }: {
          organization: any;
          user: any;
        }) => {
          // Send welcome email when user creates their first organization
          await emailService.sendWelcomeEmail({
            to: user.email,
            firstName: user.name || "User",
          });
        },
      },
    }),
  ],
});
