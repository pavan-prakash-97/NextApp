import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    await auth.api.signOut({
      headers: req.headers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
