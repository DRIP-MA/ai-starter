import { Resend } from "resend";
import { env } from "@/env";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { OrganizationInvitationEmail } from "@/components/emails/organization-invitation-email";
import { PasswordResetEmail } from "@/components/emails/password-reset-email";
import { EmailVerificationEmail } from "@/components/emails/email-verification-email";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendWelcomeEmailParams {
  to: string;
  firstName: string;
}

export interface SendOrganizationInvitationParams {
  to: string;
  invitedByName: string;
  invitedByEmail: string;
  organizationName: string;
  role: string;
  inviteLink: string;
}

export interface SendPasswordResetParams {
  to: string;
  firstName: string;
  resetLink: string;
}

export interface SendEmailVerificationParams {
  to: string;
  firstName: string;
  verificationLink: string;
}

const APP_NAME = env.NEXT_PUBLIC_APP_NAME;
const FROM_EMAIL = "send@email.allignia.io";

export const emailService = {
  async sendWelcomeEmail({ to, firstName }: SendWelcomeEmailParams) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `Welcome to ${APP_NAME}!`,
        react: WelcomeEmail({ firstName, appName: APP_NAME }),
      });

      if (error) {
        console.error("Failed to send welcome email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  },

  async sendOrganizationInvitation({
    to,
    invitedByName,
    invitedByEmail,
    organizationName,
    role,
    inviteLink,
  }: SendOrganizationInvitationParams) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `You've been invited to join ${organizationName}`,
        react: OrganizationInvitationEmail({
          invitedByName,
          invitedByEmail,
          organizationName,
          role,
          inviteLink,
          appName: APP_NAME,
        }),
      });

      if (error) {
        console.error("Failed to send organization invitation:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  },

  async sendPasswordReset({
    to,
    firstName,
    resetLink,
  }: SendPasswordResetParams) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `Reset your ${APP_NAME} password`,
        react: PasswordResetEmail({ firstName, resetLink, appName: APP_NAME }),
      });

      if (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  },

  async sendEmailVerification({
    to,
    firstName,
    verificationLink,
  }: SendEmailVerificationParams) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `Verify your ${APP_NAME} email address`,
        react: EmailVerificationEmail({
          firstName,
          verificationLink,
          appName: APP_NAME,
        }),
      });

      if (error) {
        console.error("Failed to send email verification:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Email service error:", error);
      throw error;
    }
  },
};
