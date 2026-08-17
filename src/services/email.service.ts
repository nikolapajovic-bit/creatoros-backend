import nodemailer from "nodemailer";
import { env } from "@/config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!env.EMAIL_USER || !env.EMAIL_APP_PASSWORD) {
    console.warn(
      "⚠️  Email not configured — skipping send. Set EMAIL_USER and EMAIL_APP_PASSWORD.",
    );
    return;
  }

  await transporter.sendMail({
    from: `"CreatorOS" <${env.EMAIL_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Verify your CreatorOS account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111;">Verify your email</h2>
        <p style="color: #555; line-height: 1.6;">
          Thanks for signing up for CreatorOS! Click the button below to verify your email address.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #7C5CFC; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify email
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          This link expires in 24 hours. If you didn't create a CreatorOS account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
