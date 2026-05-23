import { randomInt } from "node:crypto";

/**
 * Sends a password reset OTP code to the user's email.
 * If in production, it will attempt to send via SendGrid if configured.
 * If no key is configured, it will log the OTP in the server logs for manual recovery.
 *
 * @param {string} email - Destination email address
 * @param {string} otpCode - The 6-digit verification code
 * @param {boolean} isDemoMode - Whether the environment is running in demo/development mode
 * @returns {Promise<void>}
 */
export const sendEmailOtp = async (email, otpCode, isDemoMode) => {
  const subject = "AnnadathaBazar - Password Reset Verification Code";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e3e3de; border-radius: 12px; background-color: #fafaf4;">
      <h2 style="color: #154212; margin-top: 0;">Password Reset Request</h2>
      <p style="color: #1a1c19; font-size: 16px; line-height: 1.5;">
        You recently requested to reset your password for your AnnadathaBazar account. Please use the following 6-digit verification code to complete your password reset:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.25em; color: #154212; padding: 10px 20px; background-color: #eeeee9; border-radius: 8px; border: 1px solid #e3e3de;">
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

  // Local/Dev environment or no email key setup
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "no-reply@annadathabazar.com";

  if (!apiKey || isDemoMode) {
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
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail, name: "AnnadathaBazar Support" },
        subject,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid returned status ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to send OTP email via SendGrid:", error);
    throw new Error("Could not send verification email. Please try again later.");
  }
};
