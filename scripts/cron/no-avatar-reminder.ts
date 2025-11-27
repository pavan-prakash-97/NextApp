import "dotenv/config";
import cron from "node-cron";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../../app/lib/prisma";
import { sendEmail } from "../../app/lib/email";
import { logInfo, logError } from "../../app/lib/logger-helpers";

const PERSIST_FILE = path.resolve(__dirname, "avatar-reminders.json");
const DEFAULT_HOURS = Number(process.env.AVATAR_REMINDER_AFTER_HOURS ?? "24");
const HOURS_BETWEEN_REMINDERS = Math.max(1, DEFAULT_HOURS);
const MINUTES_INTERVAL = Number(process.env.AVATAR_REMINDER_INTERVAL_MINUTES ?? "");
const HOURS_INTERVAL = Number(process.env.AVATAR_REMINDER_INTERVAL_HOURS ?? `${HOURS_BETWEEN_REMINDERS}`);

type ReminderDB = Record<string, string>; // userId -> ISO string timestamp

async function loadDB(): Promise<ReminderDB> {
  try {
    const content = await fs.readFile(PERSIST_FILE, "utf8");
    return JSON.parse(content) as ReminderDB;
  } catch (err) {
    return {};
  }
}

async function saveDB(db: ReminderDB) {
  await fs.writeFile(PERSIST_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function findAndNotify() {
  try {
    const now = new Date();

    const db = await loadDB();

    // Find users with no image (null or empty) and updatedAt < cutoff (i.e., older than X hours)
    const users = await prisma.user.findMany({
      where: {
        AND: [{ OR: [{ image: null }, { image: "" }] }],
      },
      select: { id: true, name: true, email: true, updatedAt: true },
    });

    if (!users.length) {
      logInfo("No matching users found to remind");
      return;
    }

    for (const user of users) {
      if (!user.email) continue;
      const lastSentIso = db[user.id];
      if (lastSentIso) {
        const lastSent = new Date(lastSentIso);
        const nextAllowed = new Date(
          lastSent.getTime() + HOURS_BETWEEN_REMINDERS * 60 * 60 * 1000
        );
        if (nextAllowed > now) {
          // Not yet allowed to send again
          continue;
        }
      }

      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
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
        .cta-btn {
          display: inline-block;
          margin-top: 15px;
          padding: 10px 18px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <h1>Complete Your Profile</h1>
        </div>

        <div class="content">
          <p>Hi ${user.name ?? "User"},</p>

          <p>
            We noticed that you haven't added a profile picture yet.
            Add one to personalize your account and help others recognize you in the app.
          </p>

          <a href="${appUrl}/user" class="cta-btn">Set Your Profile Picture</a>

          <p style="margin-top: 20px;">
            Thanks — Your App Team
          </p>
        </div>

        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
  </html>
`;

      const text = `Hi ${
        user.name ?? "User"
      },\n\nWe noticed that you haven't added a profile picture yet. Add one to personalize your account: ${appUrl}/user\n\nThanks,\nYour App Team`;

      const result = await sendEmail({
        to: user.email,
        subject: "Please add your profile picture",
        html,
        text,
      });

      if (result.success) {
        db[user.id] = new Date().toISOString();
        await saveDB(db);
        logInfo("Sent profile reminder", {
          userId: user.id,
          email: user.email,
        });
      } else {
        logError(new Error(`Failed to send reminder to ${user.email}`));
      }
    }
  } catch (err: unknown) {
    logError((err as Error) ?? new Error(String(err)), { context: "cron:no-avatar-reminder" });
  }
}

// Schedule every 24 hours (or use env AVATAR_REMINDER_INTERVAL_HOURS or AVATAR_REMINDER_INTERVAL_MINUTES)
let intervalExpr = "0 0 * * *"; // default: every day at midnight
if (HOURS_INTERVAL && HOURS_INTERVAL > 0) {
  intervalExpr = `0 */${Math.max(1, HOURS_INTERVAL)} * * *`;
} else if (MINUTES_INTERVAL && MINUTES_INTERVAL > 0) {
  intervalExpr = `*/${Math.max(1, MINUTES_INTERVAL)} * * * *`;
}

const task = cron.schedule(intervalExpr, async () => {
  logInfo("Cron (no-avatar-reminder) triggered");
  // Also console.log so users running directly see output without log files
  console.log(new Date().toISOString(), "Cron (no-avatar-reminder) triggered");
  await findAndNotify();
}, { scheduled: true, timezone: process.env.CRON_TIMEZONE ?? undefined });

// Ensure it's started
task.start();
logInfo(`Cron scheduled with expression: ${intervalExpr}`);
console.log(`Cron (no-avatar-reminder) scheduled with expression: ${intervalExpr}`);

// run once immediately
findAndNotify().catch((err) => logError(err as Error, { context: "initial-run" }));

// Keep the process alive when running directly
if (require.main === module) {
  process.stdin.resume();
}
