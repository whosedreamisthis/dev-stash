import { Resend } from "resend";

// Resend's test sender only delivers to the account owner until a domain is verified
const EMAIL_FROM = process.env.EMAIL_FROM ?? "DevStash <onboarding@resend.dev>";

let resend: Resend | undefined;

// Created on first use because the constructor throws when RESEND_API_KEY is missing,
// which would otherwise break every page that imports this module
function getResend() {
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your DevStash email",
    text: `Welcome to DevStash! Verify your email address by opening this link:\n\n${verifyUrl}\n\nThe link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: `
      <p>Welcome to DevStash!</p>
      <p>Verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>The link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error(`Failed to send verification email: [${error.name}] ${error.message}`);
    return false;
  }
  return true;
}
