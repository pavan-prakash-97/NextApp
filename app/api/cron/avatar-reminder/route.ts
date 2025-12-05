import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendEmail } from "@/app/lib/email";
import { logInfo, logError } from "@/app/lib/logger-helpers";
import * as Sentry from "@sentry/nextjs";
// Protect this route using a secret. Configure `CRON_SECRET` in your Vercel project
// and use it as an Authorization Bearer token for the request.
const HEADER_NAME = "authorization";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get(HEADER_NAME) ?? "";
    const secret = process.env.CRON_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const HOURS = Number(process.env.AVATAR_REMINDER_AFTER_HOURS ?? "24");
    const cutoff = new Date(Date.now() - Math.max(1, HOURS) * 60 * 60 * 1000);

    // Find users with no image set and older updatedAt and not reminded in the last HOURS
    const toNotify = await prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ profilePicSmall: null }, { profilePicSmall: "" }] },
          { updatedAt: { lt: cutoff } },
        ],
      },
      select: { id: true, name: true, email: true },
    });

    if (!toNotify.length) {
      logInfo("No users to notify");
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sentCount = 0;

    const appUrl = process.env.APP_URL ?? "https://example.com";

    for (const user of toNotify) {
      if (!user.email) continue;
      const html = `<p>Hi ${user.name ?? "User"},</p>
        <p>We noticed you haven't added a profile picture yet. Add one to personalize your account:</p>
        <p><a href="${appUrl}/user">Add profile picture</a></p>`;
      const text = `Hi ${
        user.name ?? "User"
      },\n\nWe noticed you haven't added a profile picture yet. Add one here: ${appUrl}/user`;

      try {
        const result = await sendEmail({
          to: user.email,
          subject: "Please add a profile picture",
          html,
          text,
        });
        if (result.success) {
          sentCount++;
          logInfo("Sent profile reminder", { userId: user.id });
        } else {
          logError(
            new Error(`Email failed for ${user.email} - ${result.error}`)
          );
        }
      } catch (err) {
        logError(err as Error, { userId: user.id });
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    Sentry.captureException(error);
    logError(error as Error, { endpoint: "POST /api/cron/avatar-reminder" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
