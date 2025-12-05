import nodemailer from "nodemailer";
import { logError, logInfo } from "./logger-helpers";
import * as Sentry from "@sentry/nextjs";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    Sentry.captureException(error);
    logError(error, { context: "Email transporter verification failed" });
  } else {
    logInfo("Email transporter is ready");
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Your App"}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject,
      text,
      html,
    });

    logInfo("Email sent successfully", {
      messageId: info.messageId,
      to,
      subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logError(error as Error, {
      context: "Failed to send email",
      to,
      subject,
    });
    return { success: false, error: (error as Error).message };
  }
}

export async function sendProfileUpdateEmail(
  userEmail: string,
  userName: string
  // updatedFields?: string[]
) {
  const subject = "Profile Updated Successfully";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .fields { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .field-item { padding: 8px 0; border-bottom: 1px solid #eee; }
          .field-item:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Profile Update Notification</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your profile has been updated successfully.</p>
            
            <!-- Updated fields removed -->
            
            <p>If you didn't make these changes, please contact our support team immediately.</p>
            
            <p>Best regards,<br/>Your App Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hi ${userName},
    
    Your profile has been updated successfully.
    
    <!-- Updated fields removed -->
    
    If you didn't make these changes, please contact our support team immediately.
    
    Best regards,
    Your App Team
  `;

  return await sendEmail({ to: userEmail, subject, html, text });
}
