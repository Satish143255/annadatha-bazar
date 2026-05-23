import { EmailClient } from "@azure/communication-email";

/**
 * Sends a password reset or registration OTP code to the user's email.
 * If in production, it will attempt to send via Azure Communication Services Email if configured.
 * If no key is configured, it will log the OTP in the server logs for manual recovery.
 *
 * @param {string} email - Destination email address
 * @param {string} otpCode - The 6-digit verification code
 * @param {boolean} isDemoMode - Whether the environment is running in demo/development mode
 * @param {string} type - Context of OTP sending ("reset" | "signup")
 * @returns {Promise<void>}
 */
export const sendEmailOtp = async (email, otpCode, isDemoMode, type = "reset") => {
  const isReset = type === "reset";
  const title = isReset ? "Password Reset Request" : "Account Verification";
  const bodyText = isReset
    ? "You recently requested to reset your password for your AnnadathaBazar account. Please use the following 6-digit verification code to complete your password reset:"
    : "Thank you for starting your registration with AnnadathaBazar. Please use the following 6-digit verification code to verify your email and complete your account setup:";
  
  const subject = isReset
    ? "AnnadathaBazar - Password Reset Verification Code"
    : "AnnadathaBazar - Account Registration Verification Code";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e3e3de; border-radius: 12px; background-color: #fafaf4;">
      <h2 style="color: #1F5A3A; margin-top: 0;">${title}</h2>
      <p style="color: #1a1c19; font-size: 16px; line-height: 1.5;">
        ${bodyText}
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.25em; color: #1F5A3A; padding: 10px 20px; background-color: #eeeee9; border-radius: 8px; border: 1px solid #e3e3de;">
          ${otpCode}
        </span>
      </div>
      <p style="color: #42493e; font-size: 14px; line-height: 1.5;">
        This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e3e3de; margin: 20px 0;" />
      <p style="color: #72796e; font-size: 12px; text-align: center; margin-bottom: 0;">
        AnnadathaBazar &copy; 2026. All rights reserved.
      </p>
    </div>
  `;

  const connectionString = process.env.ACS_CONNECTION_STRING;
  const fromEmail = process.env.ACS_EMAIL_FROM || "no-reply@annadathabazar.com";

  if (!connectionString || isDemoMode) {
    console.log(`
=========================================
[SECURITY WARNING] EMAIL OTP IN DEV MODE
To: ${email}
Subject: ${subject}
OTP Code: ${otpCode}
=========================================
    `);
    return;
  }

  try {
    const client = new EmailClient(connectionString);
    const emailMessage = {
      senderAddress: fromEmail,
      content: {
        subject: subject,
        html: htmlContent,
      },
      recipients: {
        to: [{ address: email }],
      },
    };

    const poller = await client.beginSend(emailMessage);
    await poller.pollUntilDone();
  } catch (error) {
    console.error("Failed to send OTP email via Azure Communication Services:", error);
    throw new Error("Could not send verification email. Please try again later.");
  }
};
